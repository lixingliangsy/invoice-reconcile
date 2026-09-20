export interface InputField {
  key: string
  label: string
  type: 'input' | 'text' | 'textarea' | 'select'
  placeholder?: string
  options?: string[]
}

export const PRODUCT = {
  name: 'ReconcileIO',
  slug: 'invoice-reconcile',
  productId: 'PROD_61cX3hp8pMOrc3OkNWWNGH',
  priceMonthly: 19,
  yearlyProductId: 'PROD_4kkeOP1tiG6lgEAiY2BuLF',
  priceYearly: 190,
  checkoutUrl: 'https://pancake.waffo.ai/store/lixingliang-ai-tools-6cilbw8v/checkout/cs_495ef36b-8ae2-53ff-8c4f-f1059608560b',
  tagline: 'Match payments to invoices in one paste',
  description:
    'Paste your invoice list and your payment / Stripe export; a multi-step workflow parses both, matches by client, computes PAID / PARTIAL / UNPAID deterministically (with balance + duplicate checks), then drafts a reconciliation summary. For founders who close the books every month.',
  toolTitle: 'Reconcile now',
  resultLabel: 'Your reconciliation',
  ctaLabel: 'Reconcile',
  // L1 + L3 metadata
  rulesetId: 'reconcile-rules',
  pipelineId: 'ingest → match → report',
  features: [
    'Paid / partial / unpaid',
    'Balance & duplicate checks',
    'Copy-ready',
    'Month-end fast',
  ],
  inputs: [
    {
      key: 'invoices',
      label: 'Invoices (INV-001, $200, Acme)',
      type: 'textarea',
      placeholder: 'INV-001, $200, Acme Co\nINV-002, $150, Beta LLC',
    },
    {
      key: 'payments',
      label: 'Payments (Acme, $200)',
      type: 'textarea',
      placeholder: 'Acme Co, $200\nBeta LLC, $75',
    },
  ] as InputField[],
  definitionLead: "ReconcileIO — Match payments to invoices in one paste Use it as decision-support: demo mode works without a live key; live runs require configuration. No fabricated metrics, and no claims for SSO/CSV/Slack unless that surface is actually shipped.",
  geoFaq: [
    { q: "What is ReconcileIO?", a: "Match payments to invoices in one paste" },
    { q: "Who should use ReconcileIO?", a: "Operators and builders who need a fast first draft or checklist from ReconcileIO." },
    { q: "Does it work without an API key?", a: "Yes in explicit Demo mode. Live AI requires a configured key." },
    { q: "Does it guarantee outcomes?", a: "No. Outputs are decision-support; you still review before publishing or acting." },
    { q: "Does it include SSO, Slack, or bulk CSV?", a: "Only if those features are implemented in this product build — do not assume them from marketing copy." },
    { q: "Where does data go?", a: "Runs may be stored locally under the product's .data/ boundary; treat demos as ephemeral." },
  ],
  systemPrompt:
    'You are a bookkeeping assistant. Given an invoice list and a payment list, match them by client name, sum payments per client, and report each invoice as PAID, PARTIAL, or UNPAID with the outstanding amount. Tolerate name variations. Do not claim guaranteed accuracy.',
  // L5 — value-based pricing: workflow runs.
  pricing: [
    {
      tier: 'Free',
      price: '$0',
      desc: '1 workflow run / day · watermarked export',
    },
    {
      tier: 'Pro',
      price: '$19/mo',
      desc: '300 workflow runs / mo · audit log · export',
    },
    {
      tier: 'Enterprise',
      price: 'Custom',
      desc: 'SSO-ready · BYOK · higher caps · shared rulesets',
    },
  ],
  mock: (inputs: Record<string, string>): string => {
    const amtOf = (s: string) => {
      const m = s.match(/[\d.]+/)
      return m ? parseFloat(m[0]) : 0
    }
    const nameOf = (l: string) => {
      const ps = l.split(',').map((x) => x.trim()).filter(Boolean)
      const nonNum = ps.filter((p) => !/[\d.]/.test(p))
      return (nonNum[nonNum.length - 1] || ps[0] || '').trim()
    }
    const inv = (inputs['invoices'] || '')
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((l) => ({ name: nameOf(l), amt: amtOf(l) }))
    const pay = (inputs['payments'] || '')
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((l) => ({ name: nameOf(l), amt: amtOf(l) }))
    let out = 'RECONCILIATION\n\n'
    inv.forEach((r) => {
      const got = pay.filter((p) => p.name.toLowerCase() === r.name.toLowerCase()).reduce((a, p) => a + p.amt, 0)
      const st = got >= r.amt ? 'PAID' : got > 0 ? 'PARTIAL ($' + (r.amt - got) + ' left)' : 'UNPAID'
      out += '- ' + r.name + ': $' + r.amt + ' -> ' + st + '\n'
    })
    return out + '\n--- (Demo match. Add OPENAI_API_KEY for fuzzy name + date matching.)'
  },
}
