import React from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { PRODUCT } from '../lib/product'
import { geoPosts } from '../data/geoPosts'

export default function BlogPage() {
  return (
    <Layout>
      <Head>
        <title>{`${PRODUCT.name} — Blog`}</title>
        <meta name="description" content="Definitional and how-to posts on invoice reconciliation — matching payments to invoices, partial and duplicate handling, Stripe reconciliation, and a faster month-end close." />
      </Head>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-xs font-bold tracking-widest uppercase text-indigo-600 mb-3">Blog · GEO</div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Invoice reconciliation, explained</h1>
        <p className="text-lg text-slate-600 mb-10">Plain-English answers to the questions founders ask before they match payments to invoices at month-end.</p>

        <h2 className="text-2xl font-bold mt-2 mb-2 text-slate-900">Deep-dives (GEO)</h2>
        <p className="text-sm text-slate-500 mb-6">Long-form explainers on invoice reconciliation, partial payments, duplicates, tooling, and use cases. Each carries FAQPage + BlogPosting JSON-LD and an honest disclaimer.</p>
        <div className="space-y-5">
          {geoPosts.map((p) => (
            <div key={p.slug} className="border-b border-slate-200 pb-5">
              <h3 className="text-xl font-semibold">
                <a href={`/blog/${p.slug}`} className="text-indigo-700 hover:underline">{p.title}</a>
              </h3>
              <p className="text-sm text-slate-600 mt-1">{p.description}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 mt-8">InvoiceReconcile is decision-support, not a guarantee of accuracy. Always review reconciliation output before acting.</p>
      </div>
    </Layout>
  )
}
