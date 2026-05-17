import Link from "next/link";
import { designLabDesigns, designLabPages } from "@/features/design-lab/registry";

export const metadata = {
  title: "Design Lab — Gateworks"
};

export default function DesignLabPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-industrial-muted">
        Design Lab
      </p>
      <h1 className="mt-1 text-3xl font-black text-industrial-ink">
        Five complete site designs
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-industrial-steel">
        Each row is a full design direction with its own visual identity and point of view.
        Open any cell to see that design&apos;s version of a page, or use a column header to
        compare all five designs of one page side by side. The original site is untouched.
      </p>

      <div className="mt-8 overflow-x-auto rounded-lg border border-black/10 bg-white shadow-sm">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-[#f7f7f4]">
              <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                Design
              </th>
              {designLabPages.map((page) => (
                <th
                  className="px-3 py-3 text-center text-xs font-black uppercase tracking-[0.08em]"
                  key={page.slug}
                >
                  <Link
                    className="text-industrial-ink underline decoration-industrial-rail underline-offset-4 transition hover:decoration-industrial-ink"
                    href={`/design-lab/compare/${page.slug}`}
                  >
                    {page.label}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {designLabDesigns.map((design) => (
              <tr className="border-b border-black/10 last:border-b-0" key={design.id}>
                <th
                  className="max-w-[220px] px-4 py-3 align-top"
                  scope="row"
                >
                  <span className="block font-black text-industrial-ink">{design.name}</span>
                  <span className="mt-0.5 block text-xs font-medium text-industrial-muted">
                    {design.note}
                  </span>
                </th>
                {designLabPages.map((page) => (
                  <td className="px-3 py-3 text-center" key={page.slug}>
                    <Link
                      className="inline-flex h-9 items-center justify-center rounded-md border border-black/10 bg-white px-3 text-xs font-semibold text-industrial-ink transition hover:border-industrial-ink hover:bg-[#f7f7f4]"
                      href={`/design-lab/${design.id}/${page.slug}`}
                    >
                      Open
                    </Link>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-industrial-muted">
        Tip: the column headers open a side-by-side comparison of all five designs for that
        page.
      </p>
    </main>
  );
}
