import Link from "next/link";

export const metadata = {
  title: "Admin Access Denied | Gateworks"
};

export default function AdminAccessDeniedPage() {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-xl content-center px-4 py-10">
      <section className="border border-industrial-rail bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
          Gateworks Operations
        </p>
        <h1 className="mt-2 text-2xl font-black text-industrial-ink">
          Admin access denied
        </h1>
        <p className="mt-3 text-sm leading-6 text-industrial-steel">
          The signed-in account does not have an allowed admin role. Use an
          approved Gateworks admin account, or sign out and try another account.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center bg-industrial-ink px-4 text-sm font-black uppercase tracking-[0.1em] text-white"
            href="/admin/login"
          >
            Sign in
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center border border-industrial-rail px-4 text-sm font-black uppercase tracking-[0.1em] text-industrial-ink"
            href="/admin/logout"
          >
            Sign out
          </Link>
        </div>
      </section>
    </main>
  );
}
