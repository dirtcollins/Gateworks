import Link from "next/link";

export const metadata = {
  title: "Quote Lab — design versions"
};

const versions = [
  {
    id: "v1",
    name: "Operations command center",
    blurb:
      "Dense, data-rich power-user view. A KPI strip over a tight sortable table; the editor is a two-column workspace with a sticky totals rail."
  },
  {
    id: "v2",
    name: "Document-first",
    blurb:
      "The quote looks like a real printed estimate — a paper sheet with letterhead and a ruled line-item table. The list is a gallery of document cards."
  },
  {
    id: "v3",
    name: "Pipeline board",
    blurb:
      "A Kanban board of quotes by status (Draft / Sent / Approved / Invoiced). The editor is a calm single-column flow with a lifecycle timeline."
  },
  {
    id: "v4",
    name: "Modern SaaS minimal",
    blurb:
      "Airy, restrained, Stripe/Linear polish. A minimal table with a slide-in detail panel; the editor is a centered, card-sectioned form."
  },
  {
    id: "v5",
    name: "Guided builder",
    blurb:
      "A friendly stepped wizard — Customer, Line items, Terms, Review. The list leads with a big new-quote call-to-action and plain-language sections."
  }
];

export default function QuoteLabPage() {
  return (
    <main className="mx-auto max-w-[1100px] px-4 py-10">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
        Quote Lab
      </p>
      <h1 className="mt-1 text-3xl font-black text-industrial-ink">
        Five quoting designs to choose from
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-industrial-steel">
        Each version redesigns both the quotes list and the quote editor as one cohesive
        direction. Open the list and editor for each, then tell me which one to make the real
        quoting experience.
      </p>

      <div className="mt-8 grid gap-4">
        {versions.map((version, index) => (
          <div
            className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            key={version.id}
          >
            <div className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-industrial-ink text-sm font-black text-white">
                {index + 1}
              </span>
              <div>
                <h2 className="text-base font-black text-industrial-ink">{version.name}</h2>
                <p className="mt-1 max-w-xl text-sm text-industrial-steel">{version.blurb}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-lg border border-industrial-rail bg-white px-4 text-sm font-semibold text-industrial-ink transition hover:border-industrial-ink"
                href={`/quote-lab/${version.id}`}
              >
                View list
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-lg bg-industrial-ink px-4 text-sm font-semibold text-white transition hover:bg-jobsite-pine"
                href={`/quote-lab/${version.id}/editor`}
              >
                View editor
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
