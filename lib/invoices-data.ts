export type InvoiceStatus = "draft" | "sent" | "accepted" | "converted" | "void";
export type InvoicePaymentStatus =
  | "unpaid"
  | "partial"
  | "paid"
  | "overpaid"
  | "refunded"
  | "failed";

export type DbInvoiceItem = {
  id: string;
  invoiceId: string;
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  options: Record<string, string | undefined>;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type DbInvoice = {
  id: string;
  invoiceNumber: string;
  orderId: string | null;
  quoteId: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  jobsiteAddress: string;
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  terms: string;
  notes: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  amountPaid: number;
  dueAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: DbInvoiceItem[];
};

export type InvoiceItemInput = {
  productId?: string;
  variantId?: string;
  sku?: string;
  title?: string;
  options?: Record<string, string | undefined>;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
};

export type InvoiceInput = {
  id?: string;
  invoiceNumber?: string;
  orderId?: string | null;
  quoteId?: string | null;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  billingAddress?: string;
  jobsiteAddress?: string;
  status?: InvoiceStatus;
  paymentStatus?: InvoicePaymentStatus;
  terms?: string;
  notes?: string;
  subtotal?: number;
  tax?: number;
  deliveryFee?: number;
  total?: number;
  amountPaid?: number;
  dueAt?: string | null;
  sentAt?: string | null;
  items?: InvoiceItemInput[];
};

type ApiResult<T> = T & {
  ok?: boolean;
  configured?: boolean;
  persisted?: boolean;
  reason?: string;
};

async function readJson<T>(response: Response): Promise<ApiResult<T> | null> {
  try {
    return (await response.json()) as ApiResult<T>;
  } catch {
    return null;
  }
}

export async function fetchInvoices(): Promise<{
  invoices: DbInvoice[];
  configured: boolean;
}> {
  try {
    const response = await fetch("/api/invoices", {
      method: "GET",
      cache: "no-store"
    });
    const data = await readJson<{ invoices: DbInvoice[] }>(response);

    if (!data || data.configured === false) {
      return { invoices: [], configured: false };
    }

    return { invoices: data.invoices ?? [], configured: true };
  } catch {
    return { invoices: [], configured: false };
  }
}

export async function fetchInvoice(id: string): Promise<{
  invoice: DbInvoice | null;
  configured: boolean;
}> {
  try {
    const response = await fetch(`/api/invoices?id=${encodeURIComponent(id)}`, {
      method: "GET",
      cache: "no-store"
    });
    const data = await readJson<{ invoices: DbInvoice[]; invoice?: DbInvoice }>(response);

    if (!data || data.configured === false) {
      return { invoice: null, configured: false };
    }

    return {
      invoice: data.invoice ?? data.invoices?.find((row) => row.id === id) ?? null,
      configured: true
    };
  } catch {
    return { invoice: null, configured: false };
  }
}

export async function saveInvoice(
  input: InvoiceInput
): Promise<{ invoice: DbInvoice | null; persisted: boolean; reason?: string }> {
  const method = input.id ? "PATCH" : "POST";

  try {
    const response = await fetch("/api/invoices", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    const data = await readJson<{ invoice: DbInvoice }>(response);

    if (!data || data.persisted === false || data.ok === false) {
      return {
        invoice: data?.invoice ?? null,
        persisted: false,
        reason: data?.reason
      };
    }

    return { invoice: data.invoice ?? null, persisted: true };
  } catch {
    return {
      invoice: null,
      persisted: false,
      reason: "Network error - invoice was not saved."
    };
  }
}
