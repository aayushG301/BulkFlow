import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ChevronDown, LifeBuoy, Mail } from 'lucide-react'
import clsx from 'clsx'

const FAQS = [
  {
    question: 'What file types can I upload?',
    answer: 'CSV and XLSX files up to 25 MB. Each row becomes one result once the job runs.',
  },
  {
    question: 'What happens after I start a job?',
    answer:
      'The file is ingested and split into rows, then each row is processed (and optionally enriched) in the background. You can watch progress live on the job details page.',
  },
  {
    question: 'Why did some rows fail?',
    answer:
      'A row fails when it can\'t be processed - for example, invalid or missing data. Open the row in Results to see the exact validation error.',
  },
  {
    question: 'Can I retry a failed job?',
    answer:
      'Yes. From the Jobs list or a job\'s details page, choose Retry. Only rows that failed are reprocessed; completed rows are left as-is.',
  },
  {
    question: 'How do I export my results?',
    answer:
      'Once a job has completed, use Export CSV from the job details page or the Results page. Exports are generated in the background and appear in the export history once ready to download.',
  },
  {
    question: 'What does AI enrichment do?',
    answer:
      'When enabled on an upload, each row is sent through an enrichment provider after processing, and the enriched fields are attached to that row\'s result.',
  },
]

export function Help() {
  const { setPageHeader } = useOutletContext()
  const [openIndex, setOpenIndex] = useState(0)

  useEffect(() => {
    setPageHeader({ breadcrumb: [{ label: 'Help' }] })
  }, [setPageHeader])

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Help</h1>
        <p className="mt-1 text-sm text-ink-muted">Quick answers to common questions.</p>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div key={faq.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-ink">{faq.question}</span>
                <ChevronDown
                  className={clsx(
                    'size-4 shrink-0 text-ink-faint transition-transform',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
              {isOpen && <p className="px-5 pb-4 text-sm text-ink-muted">{faq.answer}</p>}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent-soft">
          <LifeBuoy className="size-5 text-accent" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">Still need help?</p>
          <a
            href="mailto:support@bulkflow.app"
            className="mt-0.5 flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            <Mail className="size-3.5" />
            support@bulkflow.app
          </a>
        </div>
      </div>
    </div>
  )
}
