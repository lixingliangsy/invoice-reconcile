// lib/schema.ts —L1 structured validation for invoice-reconcile steps (plain TypeScript, no deps).
export interface ValidationResult {
  ok: boolean
  errors: string[]
  value: any
}

function isNonEmptyString(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0
}

export const IngestSchema = {
  validate(input: Record<string, string>): ValidationResult {
    const errors: string[] = []
    if (!isNonEmptyString(input['invoices'])) errors.push('invoices list is required')
    if (!isNonEmptyString(input['payments'])) errors.push('payments list is required')
    return { ok: errors.length === 0, errors, value: input }
  },
}

export const MatchSchema = {
  validate(artifact: any): ValidationResult {
    const errors: string[] = []
    if (!Array.isArray(artifact?.rows)) errors.push('match result must list invoice rows')
    const flags: string[] = artifact?.flags || []
    if (flags.includes('no_invoices')) errors.push('cannot reconcile with no invoices')
    return { ok: errors.length === 0, errors, value: artifact }
  },
}

export const ReportSchema = {
  validate(text: string): ValidationResult {
    const errors: string[] = []
    if (!isNonEmptyString(text)) errors.push('report text is empty')
    if (text.length < 40) errors.push('report too short to be a usable reconciliation')
    return { ok: errors.length === 0, errors, value: text }
  },
}

export const Schemas: Record<string, { validate: (v: any) => ValidationResult }> = {
  ingest: IngestSchema,
  match: MatchSchema,
  report: ReportSchema,
}

export function getSchema(step: string): { validate: (v: any) => ValidationResult } | null {
  return Schemas[step] || null
}


export interface FaqItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
}

export function buildFaqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map((it) => ({
      "@type": "Question",
      "name": it.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": it.answer,
      },
    })),
  };
}

export function buildHowToJsonLd(name: string, steps: HowToStep[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "step": steps.map((s, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "name": s.name,
      "text": s.text,
    })),
  };
}