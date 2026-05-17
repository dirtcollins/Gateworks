import { EmailSignup } from "@/components/email-signup";

export function SiteFooter() {
  return (
    <footer className="px-4 pb-5">
      <div className="mx-auto max-w-[1280px] border-t border-black/10 pt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="text-sm font-black text-industrial-ink">Stay stocked.</p>
            <p className="mt-1 text-xs text-industrial-muted">
              Restock alerts, contractor pricing, and new product updates.
            </p>
            <div className="mt-3">
              <EmailSignup />
            </div>
          </div>
          <div className="text-xs text-industrial-muted sm:text-right">
            <p>Gateworks operating platform</p>
            <p className="mt-1">Products, quotes, carts, and operations</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
