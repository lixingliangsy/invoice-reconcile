// pages/api/webhook.ts — Waffo Pancake webhook receiver.
// Follows the official guide: read RAW body, verify with RSA-SHA256 (verifyWebhook),
// dedupe by event.id, then handle subscription/order/refund events.
//
// CRITICAL: webhook signature verification needs the RAW request body. Next.js parses
// JSON by default, which corrupts the signature — so we disable the body parser and
// read the stream ourselves.
import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyWebhook, WebhookEventType, type WebhookEvent, type WebhookEventData } from '@waffo/pancake-ts'
import fs from 'fs'
import path from 'path'

export const config = {
  api: { bodyParser: false },
}

// Best-effort idempotency store. NOTE: serverless filesystems are ephemeral — for production
// replace this with a durable KV/DB keyed by event.id (e.g. Vercel KV / Upstash / DynamoDB).
const SEEN_FILE = path.join(process.cwd(), '.waffo-webhook-seen.json')
const EVENT_LOG = path.join(process.cwd(), 'webhook-events.log.jsonl')
// Canonical factory fulfillment ledger: idempotent grant/revoke records.
const FULFILLMENT_FILE = path.join(process.cwd(), '.data', 'fulfilled-orders.jsonl')

function readRaw(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function alreadySeen(id: string): boolean {
  try {
    const seen = JSON.parse(fs.readFileSync(SEEN_FILE, 'utf-8'))
    return !!seen[id]
  } catch {
    return false
  }
}

function markSeen(id: string) {
  try {
    const seen = fs.existsSync(SEEN_FILE) ? JSON.parse(fs.readFileSync(SEEN_FILE, 'utf-8')) : {}
    seen[id] = Date.now()
    fs.writeFileSync(SEEN_FILE, JSON.stringify(seen))
  } catch {
    /* non-fatal */
  }
}

function logEvent(e: WebhookEvent): void {
  try {
    fs.appendFileSync(
      EVENT_LOG,
      JSON.stringify({ id: e.id, ts: e.timestamp, type: e.eventType, data: e.data }) + '\n'
    )
  } catch {
    /* non-fatal */
  }
}

/** Append an idempotent grant/revoke record to the factory fulfillment ledger. */
function recordFulfillment(opts: {
  action: 'grant' | 'revoke'
  event: WebhookEvent
  data: WebhookEventData
}): void {
  try {
    if (!fs.existsSync(path.dirname(FULFILLMENT_FILE))) {
      fs.mkdirSync(path.dirname(FULFILLMENT_FILE), { recursive: true })
    }
    const record = {
      eventId: opts.event.eventId,
      deliveryId: opts.event.id,
      eventType: opts.event.eventType,
      action: opts.action,
      buyerEmail: opts.data.buyerEmail,
      orderId: opts.data.orderId,
      productName: opts.data.productName,
      amount: opts.data.amount,
      currency: opts.data.currency,
      billingPeriod: opts.data.billingPeriod ?? null,
      planId: opts.data.orderMetadata?.planId ?? null,
      ts: opts.event.timestamp,
    }
    fs.appendFileSync(FULFILLMENT_FILE, JSON.stringify(record) + '\n')
  } catch {
    /* non-fatal */
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['x-waffo-signature']
  if (!sig || Array.isArray(sig)) return res.status(401).end('Missing signature')

  const raw = await readRaw(req)

  let event: WebhookEvent<WebhookEventData>
  try {
    // RSA-SHA256 against Waffo's built-in public keys. Auto-detects test/prod.
    event = verifyWebhook<WebhookEventData>(raw, sig as string)
  } catch {
    return res.status(401).end('Invalid signature')
  }

  // Idempotent: a delivery may be retried.
  if (alreadySeen(event.id)) return res.status(200).end('OK')
  markSeen(event.id)

  logEvent(event)

  try {
    switch (event.eventType) {
      case WebhookEventType.SubscriptionActivated:
      case WebhookEventType.SubscriptionPaymentSucceeded:
        // Provision access for event.data.buyerEmail (lookup by orderMetadata.slug).
        recordFulfillment({ action: 'grant', event, data: event.data })
        break
      case WebhookEventType.SubscriptionCanceling:
        // Keep access until period end — cycle now in subscription.activated / subscription.renewed (payment_succeeded dropped currentPeriodEnd on 2026-09-06).
        break
      case WebhookEventType.SubscriptionCanceled:
      case WebhookEventType.SubscriptionPastDue:
        // Revoke/flag access for event.data.buyerEmail.
        recordFulfillment({ action: 'revoke', event, data: event.data })
        break
      case WebhookEventType.SubscriptionUpdated:
        // Apply plan change (upgrade/downgrade) for event.data.buyerEmail.
        recordFulfillment({ action: 'grant', event, data: event.data })
        break
      case WebhookEventType.OrderCompleted:
        // One-time payment succeeded — fulfill the order.
        recordFulfillment({ action: 'grant', event, data: event.data })
        break
      case WebhookEventType.RefundSucceeded:
        // Revoke access / adjust records for event.data.buyerEmail.
        recordFulfillment({ action: 'revoke', event, data: event.data })
        break
      default:
        break
    }
  } catch (e: unknown) {
    console.error('[webhook] handler error:', e instanceof Error ? e.message : e)
  }

  return res.status(200).end('OK')
}
