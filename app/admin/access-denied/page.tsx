import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Admin Access Denied | Gateworks"
};

export const dynamic = "force-dynamic";

export default async function AdminAccessDeniedPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

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
          {user?.email
            ? `${user.email} is signed in, but that user does not have an allowed admin role in admin_profiles.`
            : "No valid admin session was found."}
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
