import Link from "next/link";
import { notFound } from "next/navigation";
import { designLabDesigns, designLabPages } from "@/features/design-lab/registry";

type ComparePageProps = {
  params: Promise<{
    page: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return designLabPages.map((page) => ({ page: page.slug }));
}

export async function generateMetadata({ params }: ComparePageProps) {
  const { page } = await params;
  const current = designLabPages.find((item) => item.slug === page);
  return { title: `Compare — ${current?.label ?? "Page"} | Design Lab` };
}

export default async function DesignLabComparePage({ params }: ComparePageProps) {
  const { page } = await params;
  const current = designLabPages.find((item) => item.slug === page);

  if (!current) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-4 py-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link
              className="text-xs font-semibold text-industrial-muted hover:text-industrial-ink"
              href="/design-lab"
            >
              ← Design Lab
            </Link>
            <h1 className="mt-1 text-2xl font-black text-industrial-ink">
              Compare: {current.label}
            </h1>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {designLabPages.map((item) => {
              const isActive = item.slug === current.slug;
              return (
                <Link
                  className={`inline-flex h-9 items-center rounded-md border px-3 text-xs font-bold transition ${
                    isActive
                      ? "border-industrial-ink bg-industrial-ink text-white"
                      : "border-black/10 bg-white text-industrial-ink hover:border-industrial-ink"
                  }`}
                  href={`/design-lab/compare/${item.slug}`}
                  key={item.slug}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex gap-4 overflow-x-auto pb-4">
          {designLabDesigns.map((design) => (
            <div
              className="flex w-[420px] shrink-0 flex-col rounded-lg border border-black/10 bg-white shadow-sm"
              key={design.id}
            >
              <div className="flex items-center justify-between gap-2 border-b border-black/10 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-industrial-ink">
                    {design.name}
                  </p>
                  <p className="truncate text-xs text-industrial-muted">{design.note}</p>
                </div>
                <Link
                  className="shrink-0 rounded-md border border-black/10 px-2 py-1 text-xs font-semibold text-industrial-ink transition hover:border-industrial-ink"
                  href={`/design-lab/${design.id}/${current.slug}`}
                  target="_blank"
                >
                  Full view
                </Link>
              </div>
              <iframe
                className="h-[760px] w-full rounded-b-lg"
                src={`/design-lab/${design.id}/${current.slug}`}
                title={`${design.name} — ${current.label}`}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
