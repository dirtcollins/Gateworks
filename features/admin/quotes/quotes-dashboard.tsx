"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Send
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/input";
import type { OrderStatus } from "@/lib/platform-backend";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import { getOrderStatusTone } from "@/lib/order-status";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

const taxRate = 0.0825;

const quoteStatusLabels: Record<OrderStatus, string> = {
  draft: "Draft request",
  submitted: "Submitted",
  confirmed: "Approved",
  picking: "Converted",
  ready_for_pickup: "Ready pickup",
  out_for_delivery: "Delivery handoff",
  completed: "Won",
  cancelled: "Declined"
};

const quotePipeline: OrderStatus[] = [
  "draft",
  "submitted",
  "confirmed",
  "picking",
  "completed",
  "cancelled"
];

const convertedSampleQuoteStorageKey = "gateworks-converted-sample-quotes";

const sampleQuoteRequests: OrderRecord[] = [
  {
    id: "sample-quote-1",
    orderNumber: "Quote-10042",
    userId: "sample",
    customerName: "Manny Ortega",
    companyName: "Anderson Fabrication",
    email: "quotes@example.com",
    phone: "555-0188",
    items: [
      {
        productId: "ornamental-panel-48",
        variantId: "ornamental-panel-48-black",
        title: "Ornamental iron panel 48 in",
        sku: "ORN-PANEL-48-BLK",
        image: "/assets/logo.svg",
        price: 420,
        quantity: 8,
        options: { finish: "Black primer" }
      },
      {
        productId: "heavy-hinge-set",
        variantId: "heavy-hinge-set-zinc",
        title: "Heavy duty weld-on hinge set",
        sku: "GATE-HINGE-HD-ZN",
        image: "/assets/logo.svg",
        price: 64,
        quantity: 12,
        options: { finish: "Zinc" }
      },
      {
        productId: "gate-latch-kit",
        variantId: "gate-latch-kit-black",
        title: "Commercial gate latch kit",
        sku: "GATE-LATCH-COM-BLK",
        image: "/assets/logo.svg",
        price: 185,
        quantity: 4,
        options: { finish: "Black" }
      }
    ],
    fulfillmentMethod: "delivery",
    requestedDate: "2026-05-18",
    requestedWindow: "9:00 AM - 11:00 AM",
    jobName: "North yard gate rebuild",
    jobsiteAddress: {
      name: "Manny Ortega",
      company: "Anderson Fabrication",
      email: "quotes@example.com",
      phone: "555-0188",
      addressLine1: "1200 Industrial Way",
      addressLine2: "Receiving gate 3",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90001",
      notes: "Quote delivery with forklift unload and contractor terms."
    },
    drawings: [
      {
        id: "drawing-sample-1",
        fileName: "north-yard-gate-sketch.pdf",
        fileSize: 1382400,
        fileType: "application/pdf",
        uploadedAt: "2026-05-14T16:00:00.000Z"
      }
    ],
    pickupContact: "Manny Ortega",
    subtotal: 4868,
    tax: 0,
    deliveryFee: 0,
    total: 4868,
    status: "submitted",
    paymentStatus: "unpaid",
    isQuoteRequest: true,
    createdAt: "2026-05-14T16:00:00.000Z",
    updatedAt: "2026-05-14T16:00:00.000Z",
    activity: [
      {
        id: "sample-quote-activity-1",
        label: "Quote request submitted",
        detail: "Customer requested delivery pricing and lead time.",
        createdAt: "2026-05-14T16:00:00.000Z"
      }
    ]
  },
  {
    id: "sample-quote-2",
    orderNumber: "Quote-10041",
    userId: "sample",
    customerName: "Dana Price",
    companyName: "Valley Gate Co.",
    email: "estimating@example.com",
    phone: "555-0162",
    items: [
      {
        productId: "square-tube-2",
        variantId: "square-tube-2-11ga",
        title: "2 in square tubing, 11 ga",
        sku: "TUBE-SQ-2-11GA",
        image: "/assets/logo.svg",
        price: 52,
        quantity: 24,
        options: { material: "Steel", length: "20 ft" }
      },
      {
        productId: "flat-bar-2",
        variantId: "flat-bar-2-14",
        title: "2 in flat bar",
        sku: "BAR-FLAT-2-14",
        image: "/assets/logo.svg",
        price: 31,
        quantity: 16,
        options: { material: "Steel", length: "20 ft" }
      }
    ],
    fulfillmentMethod: "pickup",
    requestedDate: "2026-05-16",
    requestedWindow: "1:00 PM - 3:00 PM",
    jobName: "Repeat driveway gate stock",
    jobsiteAddress: {
      name: "Dana Price",
      company: "Valley Gate Co.",
      email: "estimating@example.com",
      phone: "555-0162",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      notes: "Repeat contractor pricing from last month if available."
    },
    drawings: [],
    pickupContact: "Dana Price",
    subtotal: 1744,
    tax: 0,
    deliveryFee: 0,
    total: 1744,
    status: "draft",
    paymentStatus: "unpaid",
    isQuoteRequest: true,
    createdAt: "2026-05-13T17:20:00.000Z",
    updatedAt: "2026-05-13T17:20:00.000Z",
    activity: [
      {
        id: "sample-quote-activity-2",
        label: "Counter quote started",
        detail: "Sales counter started quote from repeat material list.",
        createdAt: "2026-05-13T17:20:00.000Z"
      }
    ]
  }
];

function getConvertedSampleQuoteIds() {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(
      window.localStorage.getItem(convertedSampleQuoteStorageKey) || "[]"
    ) as string[];
  } catch {
    return [];
  }
}

function getInitialSampleQuoteRequests() {
  const convertedIds = new Set(getConvertedSampleQuoteIds());
  return sampleQuoteRequests.filter((quote) => !convertedIds.has(quote.id));
}

function rememberConvertedSampleQuote(quoteId: string) {
  if (typeof window === "undefined" || !quoteId.startsWith("sample-quote-")) {
    return;
  }

  const convertedIds = new Set(getConvertedSampleQuoteIds());
  convertedIds.add(quoteId);
  window.localStorage.setItem(
    convertedSampleQuoteStorageKey,
    JSON.stringify(Array.from(convertedIds))
  );
}

function formatDate(value: string) {
  if (!value) return "Unscheduled";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

function getQuoteSubtotal(quote: OrderRecord) {
  return quote.items.length
    ? quote.items.reduce((total, item) => total + item.price * item.quantity, 0)
    : quote.subtotal;
}

function getQuotedTotal(quote: OrderRecord) {
  const subtotal = getQuoteSubtotal(quote);
  const deliveryFee = quote.fulfillmentMethod === "delivery" && subtotal < 500 ? 85 : 0;
  const estimatedTax = quote.status === "confirmed" ? subtotal * taxRate : 0;
  return subtotal + deliveryFee + estimatedTax;
}

export function QuotesDashboard() {
  const router = useRouter();
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const createOrder = useOrderStore((state) => state.createOrder);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [fulfillment, setFulfillment] = useState("all");
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [localQuoteRequests, setLocalQuoteRequests] =
    useState<OrderRecord[]>(sampleQuoteRequests);
  const [hasLoadedPersistedOrders, setHasLoadedPersistedOrders] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [backendNotice, setBackendNotice] = useState("");
  const [staffNote, setStaffNote] = useState(
    "Confirm material availability, contractor pricing tier, delivery fee, and expiration before sending."
  );
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);

  function buildQuotePayload(quote: OrderRecord) {
    return {
      userId: quote.userId,
      orderNumber: quote.orderNumber,
      customerName: quote.customerName,
      companyName: quote.companyName,
      email: quote.email,
      phone: quote.phone,
      items: quote.items,
      fulfillmentMethod: quote.fulfillmentMethod,
      requestedDate: quote.requestedDate,
      requestedWindow: quote.requestedWindow,
      jobName: quote.jobName,
      jobsiteAddress: quote.jobsiteAddress,
      drawings: quote.drawings,
      pickupContact: quote.pickupContact,
      subtotal: quote.subtotal,
      tax: quote.tax,
      deliveryFee: quote.deliveryFee,
      total: quote.total,
      status: quote.status,
      paymentStatus: quote.paymentStatus,
      isQuoteRequest: quote.isQuoteRequest
    };
  }

  async function handleCreateQuote() {
    if (isCreatingQuote) return;

    setIsCreatingQuote(true);
    setBackendNotice("");

    const createdQuote = createOrder({
      userId: "admin-user",
      customerName: "New Customer",
      companyName: "New Customer",
      email: "customer@example.com",
      phone: "555-0187",
      items: [],
      fulfillmentMethod: "delivery",
      requestedDate: new Date().toISOString().slice(0, 10),
      requestedWindow: "12:00 PM - 2:00 PM",
      jobName: "New quote",
      jobsiteAddress: {
        name: "New Customer",
        company: "New Customer",
        email: "customer@example.com",
        phone: "555-0187",
        addressLine1: "500 Main Street",
        addressLine2: "",
        city: "Los Angeles",
        state: "CA",
        postalCode: "90001",
        notes: "Quote created from admin workspace."
      },
      drawings: [],
      pickupContact: "New Customer",
      subtotal: 0,
      tax: 0,
      deliveryFee: 0,
      total: 0,
      status: "draft",
      paymentStatus: "unpaid",
      isQuoteRequest: true
    });

    setSelectedQuoteId(createdQuote.id);
    setActionMessage("New quote created. Add products and build details from this workspace.");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildQuotePayload(createdQuote))
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        persisted?: boolean;
        orderId?: string;
        orderNumber?: string;
        reason?: string;
      };

      if (payload.persisted && payload.orderId) {
        const persistedQuote: OrderRecord = {
          ...createdQuote,
          id: payload.orderId,
          orderNumber: payload.orderNumber || createdQuote.orderNumber,
          updatedAt: new Date().toISOString()
        };
        setOrders(
          useOrderStore
            .getState()
            .orders.map((order) => (order.id === createdQuote.id ? persistedQuote : order))
        );
        setSelectedQuoteId(payload.orderId);
        setActionMessage(
          "Quote saved to backend. Add products and build details from this workspace."
        );
        router.push(`/admin/quotes/${payload.orderId}`);
      } else if (payload.persisted === false) {
        setBackendNotice(
          payload.reason ||
            "Supabase is not configured. New quote was created locally and saved only in this browser."
        );
        router.push(`/admin/quotes/${createdQuote.id}`);
      } else {
        router.push(`/admin/quotes/${createdQuote.id}`);
      }
    } catch (error) {
      setBackendNotice(
        error instanceof Error && error.message
          ? error.message
          : "Unable to persist new quote right now; it remains in your local workspace."
      );
      router.push(`/admin/quotes/${createdQuote.id}`);
    }

    window.setTimeout(() => {
      setActionMessage("");
      setIsCreatingQuote(false);
  }, 4500);
  }

  useEffect(() => {
    setLocalQuoteRequests(getInitialSampleQuoteRequests());
  }, []);

  const quoteRequests = useMemo(() => {
    const requests = storedOrders.filter((order) => order.isQuoteRequest);
    if (requests.length) return requests;
    if (hasLoadedPersistedOrders && storedOrders.length) return [];
    return localQuoteRequests;
  }, [hasLoadedPersistedOrders, localQuoteRequests, storedOrders]);

  const filteredQuotes = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return quoteRequests.filter((quote) => {
      const matchesSearch =
        !normalized ||
        quote.orderNumber.toLowerCase().includes(normalized) ||
        quote.customerName.toLowerCase().includes(normalized) ||
        quote.companyName.toLowerCase().includes(normalized) ||
        quote.jobName.toLowerCase().includes(normalized) ||
        quote.items.some((item) => item.sku.toLowerCase().includes(normalized));
      const matchesStatus = status === "all" || quote.status === status;
      const matchesFulfillment =
        fulfillment === "all" || quote.fulfillmentMethod === fulfillment;

      return matchesSearch && matchesStatus && matchesFulfillment;
    });
  }, [fulfillment, query, quoteRequests, status]);

  const selectedQuote =
    filteredQuotes.find((quote) => quote.id === selectedQuoteId) ||
    quoteRequests.find((quote) => quote.id === selectedQuoteId) ||
    filteredQuotes[0] ||
    quoteRequests[0];

  const summary = {
    open: quoteRequests.filter((quote) =>
      ["draft", "submitted"].includes(quote.status)
    ).length,
    needsPricing: quoteRequests.filter((quote) => quote.status === "submitted").length,
    approved: quoteRequests.filter((quote) => quote.status === "confirmed").length,
    converted: quoteRequests.filter((quote) =>
      ["picking", "ready_for_pickup", "out_for_delivery", "completed"].includes(
        quote.status
      )
    ).length,
    value: quoteRequests
      .filter((quote) => !["cancelled"].includes(quote.status))
      .reduce((total, quote) => total + getQuotedTotal(quote), 0)
  };

  function persistQuoteStatus(
    quoteId: string,
    nextStatus: OrderStatus,
    detail: string
  ) {
    const now = new Date().toISOString();
    const label =
      nextStatus === "picking" ? "Quote converted to order" : "Quote status updated";

    setLocalQuoteRequests((quotes) =>
      quotes.map((quote) =>
        quote.id === quoteId
          ? {
              ...quote,
              status: nextStatus,
              updatedAt: now,
              activity: [
                {
                  id: `${quoteId}-${Date.now()}`,
                  label,
                  detail,
                  createdAt: now
                },
                ...quote.activity
              ]
            }
          : quote
      )
    );
    updateOrderStatus(quoteId, nextStatus, detail);
    setActionMessage(
      nextStatus === "picking"
        ? "Quote converted. It is now marked for the order workflow."
        : "Quote status updated."
    );
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: quoteId, status: nextStatus })
    })
      .then((response) => response.json())
      .then((payload: { persisted?: boolean; reason?: string }) => {
        if (!payload.persisted) {
          setBackendNotice(
            payload.reason ||
              "Supabase is not configured. Quote changes are saved in this browser only."
          );
        }
      })
      .catch(() => null);

    window.setTimeout(() => setActionMessage(""), 2600);
  }

  function convertQuoteToOrder(quote: OrderRecord) {
    const now = new Date().toISOString();
    const detail = "Quote converted to order workflow.";
    const existingOrder = storedOrders.find((order) => order.id === quote.id);
    let convertedOrderNumber = quote.orderNumber;

    if (existingOrder) {
      setOrders(
        storedOrders.map((order) =>
          order.id === quote.id
            ? {
                ...order,
                isQuoteRequest: false,
                status: "submitted",
                updatedAt: now,
                activity: [
                  {
                    id: `${quote.id}-${Date.now()}`,
                    label: "Quote converted to order",
                    detail,
                    createdAt: now
                  },
                  ...order.activity
                ]
              }
            : order
        )
      );
    } else {
      const converted = createOrder({
        userId: quote.userId,
        customerName: quote.customerName,
        companyName: quote.companyName,
        email: quote.email,
        phone: quote.phone,
        items: quote.items,
        fulfillmentMethod: quote.fulfillmentMethod,
        requestedDate: quote.requestedDate,
        requestedWindow: quote.requestedWindow,
        jobName: quote.jobName,
        jobsiteAddress: quote.jobsiteAddress,
        drawings: quote.drawings,
        pickupContact: quote.pickupContact,
        subtotal: getQuoteSubtotal(quote),
        tax: quote.status === "confirmed" ? getQuoteSubtotal(quote) * taxRate : 0,
        deliveryFee:
          quote.fulfillmentMethod === "delivery" && getQuoteSubtotal(quote) < 500
            ? 85
            : 0,
        total: getQuotedTotal({ ...quote, status: "submitted" }),
        status: "submitted",
        paymentStatus: "unpaid",
        isQuoteRequest: false
      });
      convertedOrderNumber = converted.orderNumber;
    }

    setLocalQuoteRequests((quotes) =>
      quotes.filter((localQuote) => localQuote.id !== quote.id)
    );
    rememberConvertedSampleQuote(quote.id);
    setSelectedQuoteId("");
    setActionMessage(
      `Quote ${quote.orderNumber} converted to order ${convertedOrderNumber}. Open Orders to continue fulfillment.`
    );

    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: quote.id,
        status: "submitted",
        convertToOrder: true
      })
    })
      .then((response) => response.json())
      .then((payload: { persisted?: boolean; reason?: string }) => {
        if (!payload.persisted) {
          setBackendNotice(
            payload.reason ||
              "Supabase is not configured. Converted orders are saved in this browser only."
          );
        }
      })
      .catch(() => null);

    window.setTimeout(() => setActionMessage(""), 5000);
  }

  function openEmailPreview(quote: OrderRecord) {
    const subject = encodeURIComponent(
      `${quote.orderNumber} quote for ${quote.companyName || quote.customerName}`
    );
    const body = encodeURIComponent(
      [
        `${quote.companyName || quote.customerName},`,
        "",
        `Quote ${quote.orderNumber} is ready for review.`,
        `Project: ${quote.jobName || "Material quote"}`,
        `Estimated total: ${formatCurrency(getQuotedTotal(quote))}`,
        "",
        staffNote
      ].join("\n")
    );

    window.location.href = `mailto:${quote.email}?subject=${subject}&body=${body}`;
  }

  const quoteColumns: DataTableColumn<OrderRecord>[] = [
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (quote) => quoteStatusLabels[quote.status],
      render: (quote) => (
        <Badge tone={getOrderStatusTone(quote.status)}>{quoteStatusLabels[quote.status]}</Badge>
      )
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      sortValue: (quote) => quote.requestedDate || quote.createdAt,
      render: (quote) => (
        <div>
          <p className="font-medium text-industrial-ink">
            {formatDate(quote.requestedDate || quote.createdAt)}
          </p>
          <p className="text-xs text-industrial-muted">Requested</p>
        </div>
      )
    },
    {
      key: "number",
      header: "Number",
      sortable: true,
      sortValue: (quote) => quote.orderNumber,
      render: (quote) => (
        <span className="font-semibold text-industrial-ink">{quote.orderNumber}</span>
      )
    },
    {
      key: "customer",
      header: "Customer",
      sortable: true,
      sortValue: (quote) => (quote.companyName || quote.customerName).toLowerCase(),
      render: (quote) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-industrial-ink">
            {quote.companyName || quote.customerName}
          </p>
          <p className="truncate text-xs text-industrial-muted">
            {quote.customerName} · {quote.jobName || "Material quote"}
          </p>
        </div>
      )
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      sortable: true,
      sortValue: (quote) => getQuotedTotal(quote),
      render: (quote) => (
        <span className="font-semibold text-industrial-ink">
          {formatCurrency(getQuotedTotal(quote))}
        </span>
      )
    },
    {
      key: "fulfillment",
      header: "Fulfillment",
      sortable: true,
      sortValue: (quote) => quote.fulfillmentMethod,
      render: (quote) => (
        <span className="font-medium capitalize text-industrial-ink">
          {quote.fulfillmentMethod}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (quote) => (
        <Link
          className="inline-flex h-8 items-center justify-center rounded-md border border-industrial-rail bg-white px-3 text-xs font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:border-industrial-ink"
          href={`/admin/quotes/${quote.id}`}
        >
          Open
        </Link>
      )
    }
  ];

  return (
    <main className="px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto grid max-w-[1280px] gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-lg border border-black/10 bg-white/86 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col gap-3 border-b border-black/10 bg-[#fafaf8] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">
                  Quotes
                </span>
                <span className="text-sm font-medium text-industrial-muted">
                  {filteredQuotes.length} active
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-industrial-ink">
                Quote workspace
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="h-10 rounded-lg normal-case tracking-normal"
                disabled={isCreatingQuote}
                onClick={handleCreateQuote}
                type="button"
                variant="primary"
              >
                <Plus size={16} />
                Create new quote
              </Button>
            </div>
          </div>

          <div className="grid gap-4 border-b border-black/10 p-4 lg:grid-cols-[1fr_220px_200px]">
            <label className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted"
                size={16}
              />
              <Input
                className="h-10 rounded-lg border-black/10 bg-[#f7f7f4] pl-9 text-sm font-medium focus:bg-white"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search quote, customer, SKU"
                value={query}
              />
            </label>
            <Select
              className="h-10 rounded-lg border-black/10 bg-[#f7f7f4] text-sm font-medium focus:bg-white"
              onChange={(event) =>
                setStatus(event.target.value as "all" | OrderStatus)
              }
              value={status}
            >
              <option value="all">All statuses</option>
              {quotePipeline.map((item) => (
                <option key={item} value={item}>
                  {quoteStatusLabels[item]}
                </option>
              ))}
            </Select>
            <Select
              className="h-10 rounded-lg border-black/10 bg-[#f7f7f4] text-sm font-medium focus:bg-white"
              onChange={(event) => setFulfillment(event.target.value)}
              value={fulfillment}
            >
              <option value="all">All fulfillment</option>
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </Select>
          </div>

          {actionMessage ? (
            <div className="border-b border-black/10 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {actionMessage}
            </div>
          ) : null}

          {backendNotice ? (
            <div className="border-b border-black/10 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              Backend notice: {backendNotice}
            </div>
          ) : null}

          <div className="p-4">
            <DataTable
              caption="Quote requests"
              columns={quoteColumns}
              emptyDescription="No matching quote requests."
              emptyTitle="No quote requests"
              getRowKey={(quote) => quote.id}
              pageSize={25}
              rows={filteredQuotes}
            />
          </div>
        </section>

        <aside className="grid h-fit gap-4">
          <section className="rounded-lg border border-black/10 bg-white/86 p-4 shadow-sm backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-industrial-muted">
              Workflow
            </p>
            <div className="mt-4 grid gap-3">
              {[
                ["Open", String(summary.open)],
                ["Needs pricing", String(summary.needsPricing)],
                ["Approved", String(summary.approved)],
                ["Converted", String(summary.converted)]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 border-b border-black/10 pb-2 last:border-b-0 last:pb-0">
                  <span className="text-sm font-semibold text-industrial-ink">{label}</span>
                  <span className="text-sm font-semibold text-industrial-muted">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-black/10 bg-white/86 p-4 shadow-sm backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-industrial-muted">
              Pipeline value
            </p>
            <p className="mt-2 text-3xl font-semibold text-industrial-ink">
              {formatCurrency(summary.value)}
            </p>
            <Button
              className="mt-4 h-11 w-full rounded-lg normal-case tracking-normal"
              disabled={isCreatingQuote}
              onClick={handleCreateQuote}
              type="button"
              variant="primary"
            >
              <Send size={16} />
              New quote
            </Button>
          </section>
        </aside>
      </div>
    </main>
  );
}
