// Shared client data layer for database-backed quotes and purchase orders.
//
// This module is the contract every quote / purchase-order UI builds against.
// It is framework-agnostic (safe to call from client components) and talks to
// the /api/quotes, /api/quotes/convert, and /api/procurement routes via fetch.
//
// Every function degrades gracefully: when Supabase is not configured the API
// routes return `configured: false` and these helpers return empty data with
// `configured: false` rather than throwing.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "invoiced"
  | "converted";

export type ProcurementStatus =
  | "draft"
  | "sent"
  | "partial"
  | "received"
  | "closed";

export type DbQuoteItem = {
  id: string;
  quoteId: string;
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  options: Record<string, string | undefined>;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type DbQuote = {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  isTemplate: boolean;
  templateName: string;
  siteUserId: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  jobsiteAddress: string;
  terms: string;
  notes: string;
  subtotal: number;
  tax: number;
  total: number;
  createdBy: string;
  convertedOrderId: string | null;
  createdAt: string;
  updatedAt: string;
  items: DbQuoteItem[];
};

export type QuoteItemInput = {
  productId?: string;
  variantId?: string;
  sku?: string;
  title?: string;
  options?: Record<string, string | undefined>;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
};

export type QuoteInput = {
  // Omit `id` to create, include it to update.
  id?: string;
  quoteNumber?: string;
  status?: QuoteStatus;
  isTemplate?: boolean;
  templateName?: string;
  siteUserId?: string | null;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  billingAddress?: string;
  jobsiteAddress?: string;
  terms?: string;
  notes?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  createdBy?: string;
  items?: QuoteItemInput[];
};

export type ProcurementOrderItem = {
  id: string;
  procurementOrderId: string;
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  lineTotal: number;
};

export type ProcurementOrder = {
  id: string;
  poNumber: string;
  supplierName: string;
  status: ProcurementStatus;
  expectedAt: string | null;
  notes: string;
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: ProcurementOrderItem[];
};

export type ProcurementOrderItemInput = {
  productId?: string;
  variantId?: string;
  sku?: string;
  title?: string;
  quantityOrdered?: number;
  quantityReceived?: number;
  unitCost?: number;
  lineTotal?: number;
};

export type ProcurementOrderInput = {
  // Omit `id` to create, include it to update.
  id?: string;
  poNumber?: string;
  supplierName?: string;
  status?: ProcurementStatus;
  expectedAt?: string | null;
  notes?: string;
  subtotal?: number;
  total?: number;
  items?: ProcurementOrderItemInput[];
};

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

type ApiResult<T> = T & { ok?: boolean; configured?: boolean; persisted?: boolean };

async function readJson<T>(response: Response): Promise<ApiResult<T> | null> {
  try {
    return (await response.json()) as ApiResult<T>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------

export type FetchQuotesOptions = {
  siteUserId?: string;
  status?: string;
  templatesOnly?: boolean;
};

export async function fetchQuotes(
  opts: FetchQuotesOptions = {}
): Promise<{ quotes: DbQuote[]; configured: boolean }> {
  const params = new URLSearchParams();
  if (opts.siteUserId) params.set("siteUserId", opts.siteUserId);
  if (opts.status) params.set("status", opts.status);
  if (opts.templatesOnly) params.set("template", "true");

  const query = params.toString();

  try {
    const response = await fetch(`/api/quotes${query ? `?${query}` : ""}`, {
      method: "GET",
      cache: "no-store"
    });
    const data = await readJson<{ quotes: DbQuote[] }>(response);

    if (!data || data.configured === false) {
      return { quotes: [], configured: false };
    }

    return { quotes: data.quotes ?? [], configured: true };
  } catch {
    return { quotes: [], configured: false };
  }
}

export async function fetchQuote(
  id: string
): Promise<{ quote: DbQuote | null; configured: boolean }> {
  try {
    const response = await fetch(`/api/quotes?id=${encodeURIComponent(id)}`, {
      method: "GET",
      cache: "no-store"
    });
    const data = await readJson<{ quotes: DbQuote[]; quote?: DbQuote }>(response);

    if (!data || data.configured === false) {
      return { quote: null, configured: false };
    }

    const quote = data.quote ?? data.quotes?.find((row) => row.id === id) ?? null;
    return { quote, configured: true };
  } catch {
    return { quote: null, configured: false };
  }
}

export async function saveQuote(
  input: QuoteInput
): Promise<{ quote: DbQuote | null; persisted: boolean }> {
  const method = input.id ? "PATCH" : "POST";

  try {
    const response = await fetch("/api/quotes", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    const data = await readJson<{ quote: DbQuote }>(response);

    if (!data || data.persisted === false || data.ok === false) {
      return { quote: data?.quote ?? null, persisted: false };
    }

    return { quote: data.quote ?? null, persisted: true };
  } catch {
    return { quote: null, persisted: false };
  }
}

export async function deleteQuote(id: string): Promise<{ persisted: boolean }> {
  try {
    const response = await fetch(`/api/quotes?id=${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    const data = await readJson<Record<string, never>>(response);
    return { persisted: Boolean(data && data.persisted !== false && data.ok !== false) };
  } catch {
    return { persisted: false };
  }
}

export async function convertQuoteToOrder(
  id: string
): Promise<{ orderId: string | null; orderNumber: string | null; persisted: boolean }> {
  try {
    const response = await fetch("/api/quotes/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const data = await readJson<{ orderId: string; orderNumber: string }>(response);

    if (!data || data.persisted === false || data.ok === false) {
      return { orderId: null, orderNumber: null, persisted: false };
    }

    return {
      orderId: data.orderId ?? null,
      orderNumber: data.orderNumber ?? null,
      persisted: true
    };
  } catch {
    return { orderId: null, orderNumber: null, persisted: false };
  }
}

// ---------------------------------------------------------------------------
// Procurement orders
// ---------------------------------------------------------------------------

export async function fetchProcurementOrders(): Promise<{
  orders: ProcurementOrder[];
  configured: boolean;
}> {
  try {
    const response = await fetch("/api/procurement", {
      method: "GET",
      cache: "no-store"
    });
    const data = await readJson<{ orders: ProcurementOrder[] }>(response);

    if (!data || data.configured === false) {
      return { orders: [], configured: false };
    }

    return { orders: data.orders ?? [], configured: true };
  } catch {
    return { orders: [], configured: false };
  }
}

export async function saveProcurementOrder(
  input: ProcurementOrderInput
): Promise<{ order: ProcurementOrder | null; persisted: boolean }> {
  const method = input.id ? "PATCH" : "POST";

  try {
    const response = await fetch("/api/procurement", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    const data = await readJson<{ order: ProcurementOrder }>(response);

    if (!data || data.persisted === false || data.ok === false) {
      return { order: data?.order ?? null, persisted: false };
    }

    return { order: data.order ?? null, persisted: true };
  } catch {
    return { order: null, persisted: false };
  }
}

export type ReceiveProcurementItem = {
  itemId: string;
  quantityReceived: number;
};

export async function receiveProcurementItems(
  procurementOrderId: string,
  receipts: ReceiveProcurementItem[]
): Promise<{ order: ProcurementOrder | null; persisted: boolean }> {
  try {
    const response = await fetch("/api/procurement", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: procurementOrderId,
        action: "receive",
        receipts
      })
    });
    const data = await readJson<{ order: ProcurementOrder }>(response);

    if (!data || data.persisted === false || data.ok === false) {
      return { order: data?.order ?? null, persisted: false };
    }

    return { order: data.order ?? null, persisted: true };
  } catch {
    return { order: null, persisted: false };
  }
}

export async function deleteProcurementOrder(
  id: string
): Promise<{ persisted: boolean }> {
  try {
    const response = await fetch(`/api/procurement?id=${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    const data = await readJson<Record<string, never>>(response);
    return { persisted: Boolean(data && data.persisted !== false && data.ok !== false) };
  } catch {
    return { persisted: false };
  }
}
