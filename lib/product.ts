export interface InputField {
  key: string
  label: string
  type: 'input' | 'textarea' | 'select'
  placeholder?: string
  options?: string[]
}

export const PRODUCT = {
  name: "ReconcileIO",
  slug: "invoice-reconcile",
  tagline: "Match payments to invoices in one paste",
  description: "Paste your invoice list and your payment / Stripe export; get a matched table showing what is paid, partial, or missing. For founders who close the books every month.",
  toolTitle: "Reconcile now",
  resultLabel: "Your reconciliation",
  ctaLabel: "Reconcile",
  features: [
  "Paid / partial / unpaid",
  "No spreadsheet",
  "Copy-ready",
  "Month-end fast"
],
  inputs: [
  {
    "key": "invoices",
    "label": "Invoices (INV-001, $200, Acme)",
    "type": "textarea",
    "placeholder": "INV-001, $200, Acme Co\nINV-002, $150, Beta LLC"
  },
  {
    "key": "payments",
    "label": "Payments (Acme, $200)",
    "type": "textarea",
    "placeholder": "Acme Co, $200\nBeta LLC, $75"
  }
] as InputField[],
  systemPrompt: "You are a bookkeeping assistant. Given an invoice list and a payment list, match them by client name, sum payments per client, and report each invoice as PAID, PARTIAL, or UNPAID with the outstanding amount. Tolerate name variations.",
  pricing: [
  {
    "tier": "Free",
    "price": "$0",
    "desc": "Unlimited"
  },
  {
    "tier": "Pro",
    "price": "$9/mo",
    "desc": "Fuzzy match, history"
  },
  {
    "tier": "Team",
    "price": "$29/mo",
    "desc": "Multi-currency, export"
  }
],
  mock: (inputs: Record<string, string>): string => {
  const amtOf = (s) => { const m = s.match(/[\d.]+/); return m ? parseFloat(m[0]) : 0 }
  const nameOf = (l) => { const ps = l.split(',').map(x => x.trim()).filter(Boolean); const nonNum = ps.filter(p => !/[\d.]/.test(p)); return (nonNum[nonNum.length - 1] || ps[0] || '').trim() }
  const inv = (inputs['invoices'] || '').split(/\n/).map(s => s.trim()).filter(Boolean).map(l => ({ name: nameOf(l), amt: amtOf(l) }))
  const pay = (inputs['payments'] || '').split(/\n/).map(s => s.trim()).filter(Boolean).map(l => ({ name: nameOf(l), amt: amtOf(l) }))
  let out = 'RECONCILIATION\n\n'
  inv.forEach(r => {
    const got = pay.filter(p => p.name.toLowerCase() === r.name.toLowerCase()).reduce((a, p) => a + p.amt, 0)
    const st = got >= r.amt ? 'PAID' : got > 0 ? 'PARTIAL ($' + (r.amt - got) + ' left)' : 'UNPAID'
    out += '- ' + r.name + ': $' + r.amt + ' -> ' + st + '\n'
  })
  return out + '\n--- (Mock match. Add OPENAI_API_KEY for fuzzy name + date matching.)'
}
}
