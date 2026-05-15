import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/app/admin/login/admin-login-form";
import { isAdminRole } from "@/lib/admin-roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminLoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export const metadata = {
  title: "Admin Login | Gateworks"
};

export default async function AdminLoginPage({
  searchParams
}: AdminLoginPageProps) {
  const { next } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (isAdminRole(profile?.role)) {
      redirect(next?.startsWith("/admin") ? next : "/admin");
    }

    redirect("/admin/access-denied");
  }

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md content-center px-4 py-10">
      <section className="border border-industrial-rail bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
          Gateworks Operations
        </p>
        <h1 className="mt-2 text-2xl font-black text-industrial-ink">
          Admin login
        </h1>
        <p className="mt-2 text-sm leading-6 text-industrial-steel">
          Sign in with a Supabase user that has an admin profile.
        </p>
        <div className="mt-6">
          <AdminLoginForm />
        </div>
      </section>
    </main>
  );
}

