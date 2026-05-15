import type { AdminPatchPayload } from "@/features/admin/catalog/types";

type AdminPatchResult = {
  ok: boolean;
  message: string;
};

export async function persistAdminChange(
  payload: AdminPatchPayload,
  message: string
): Promise<AdminPatchResult> {
  try {
    const response = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = (await response.json().catch(() => null)) as
      | { reason?: string }
      | null;

    if (!response.ok) {
      return {
        ok: false,
        message: result?.reason || `${message} was not saved to Supabase`
      };
    }

    return {
      ok: true,
      message: `${message} · backend saved`
    };
  } catch {
    return {
      ok: false,
      message: `${message} · Supabase save failed`
    };
  }
}
