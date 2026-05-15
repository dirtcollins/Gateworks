"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Mail,
  PackageCheck,
  Search,
  Send,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";
import type { OrderStatus } from "@/lib/platform-backend";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import { formatCurrency } from "@/lib/utils";

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
    orderNumber: "GW-Q-1042",
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
    orderNumber: "GW-Q-1041",
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

  useEffect(() => {
    setLocalQuoteRequests(getInitialSampleQuoteRequests());

    async function loadQuoteRequests() {
      const response = await fetch("/api/orders?limit=250", { cache: "no-store" });
      if (!response.ok) return;

      const payload = (await response.json()) as {
        orders?: OrderRecord[];
        persisted?: boolean;
        reason?: string;
      };

      if (payload.persisted && payload.orders) {
        setHasLoadedPersistedOrders(true);
        setBackendNotice("");
        setOrders(payload.orders);
      } else if (!payload.persisted) {
        setBackendNotice(
          payload.reason ||
            "Supabase is not configured. Quote changes are saved in this browser only."
        );
      }
    }

    void loadQuoteRequests();
  }, [setOrders]);

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

  return (
    <PageShell
      description="Sales counter quote desk for customer quote requests, contractor pricing, drawing review, approval, send-out, and quote-to-order conversion."
      eyebrow="Gateworks Operations"
      title="Quotes"
    >
      <div className="grid gap-5">
        <StatGrid
          className="grid-cols-2 overflow-hidden bg-white lg:grid-cols-5"
          stats={[
            { label: "Open", value: summary.open },
            { label: "Needs pricing", value: summary.needsPricing },
            { label: "Approved", value: summary.approved },
            { label: "Converted", value: summary.converted },
            { label: "Pipeline value", value: formatCurrency(summary.value) }
          ]}
        />

        {actionMessage ? (
          <div className="border border-industrial-pine bg-industrial-paper p-3 text-sm font-black text-industrial-pine">
            {actionMessage}
          </div>
        ) : null}

        {backendNotice ? (
          <div className="border border-amber-700 bg-amber-50 p-3 text-sm font-black text-amber-900">
            Backend notice: {backendNotice}
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
          <Card>
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Quote Queue
                </p>
                <h2 className="text-xl font-black text-industrial-ink">
                  Requests and estimates
                </h2>
              </div>
              <FileText size={20} />
            </CardHeader>
            <CardBody className="grid gap-3">
              <label className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted"
                  size={16}
                />
                <Input
                  className="pl-9"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search quote, customer, SKU"
                  value={query}
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                <Select
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
                  onChange={(event) => setFulfillment(event.target.value)}
                  value={fulfillment}
                >
                  <option value="all">All fulfillment</option>
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                </Select>
              </div>

              <div className="max-h-[680px] overflow-auto border border-industrial-rail">
                {filteredQuotes.map((quote) => (
                  <button
                    className={`grid w-full gap-2 border-b border-industrial-rail p-3 text-left transition hover:bg-industrial-paper ${
                      selectedQuote?.id === quote.id
                        ? "bg-industrial-amber"
                        : "bg-white"
                    }`}
                    key={quote.id}
                    onClick={() => setSelectedQuoteId(quote.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-industrial-ink">
                          {quote.orderNumber}
                        </p>
                        <p className="text-sm text-industrial-steel">
                          {quote.companyName || quote.customerName}
                        </p>
                      </div>
                      <span className="border border-industrial-rail bg-white px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em]">
                        {quoteStatusLabels[quote.status]}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-industrial-muted">
                      {quote.fulfillmentMethod} / {formatDate(quote.requestedDate)} /{" "}
                      {formatCurrency(getQuotedTotal(quote))}
                    </p>
                  </button>
                ))}

                {!filteredQuotes.length ? (
                  <div className="grid place-items-center p-8 text-center">
                    <FileText className="text-industrial-muted" size={24} />
                    <p className="mt-3 text-sm font-black text-industrial-ink">
                      No matching quote requests.
                    </p>
                  </div>
                ) : null}
              </div>
            </CardBody>
          </Card>

          {selectedQuote ? (
            <section className="grid content-start gap-5">
              <Card>
                <CardHeader>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                      {selectedQuote.orderNumber}
                    </p>
                    <h2 className="text-2xl font-black text-industrial-ink">
                      {selectedQuote.jobName ||
                        selectedQuote.companyName ||
                        selectedQuote.customerName}
                    </h2>
                    <p className="mt-2 text-sm text-industrial-steel">
                      {selectedQuote.customerName} / {selectedQuote.email} /{" "}
                      {selectedQuote.phone}
                    </p>
                  </div>
                  <Select
                    className="max-w-xs"
                    onChange={(event) =>
                      persistQuoteStatus(
                        selectedQuote.id,
                        event.target.value as OrderStatus,
                        "Changed from admin quote desk."
                      )
                    }
                    value={selectedQuote.status}
                  >
                    {quotePipeline.map((item) => (
                      <option key={item} value={item}>
                        {quoteStatusLabels[item]}
                      </option>
                    ))}
                  </Select>
                </CardHeader>
                <CardBody className="grid gap-5">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="border border-industrial-rail p-3">
                      <ClipboardCheck size={18} />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                        Status
                      </p>
                      <p className="font-black text-industrial-ink">
                        {quoteStatusLabels[selectedQuote.status]}
                      </p>
                    </div>
                    <div className="border border-industrial-rail p-3">
                      <Truck size={18} />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                        Fulfillment
                      </p>
                      <p className="font-black capitalize text-industrial-ink">
                        {selectedQuote.fulfillmentMethod}
                      </p>
                    </div>
                    <div className="border border-industrial-rail p-3">
                      <CalendarDays size={18} />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                        Needed by
                      </p>
                      <p className="font-black text-industrial-ink">
                        {formatDate(selectedQuote.requestedDate)}
                      </p>
                      <p className="text-xs text-industrial-steel">
                        {selectedQuote.requestedWindow}
                      </p>
                    </div>
                    <div className="border border-industrial-rail p-3">
                      <CheckCircle2 size={18} />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                        Quote total
                      </p>
                      <p className="font-black text-industrial-ink">
                        {formatCurrency(getQuotedTotal(selectedQuote))}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                    <Card>
                      <CardHeader>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                            Pricing
                          </p>
                          <h3 className="text-lg font-black text-industrial-ink">
                            Line items
                          </h3>
                        </div>
                      </CardHeader>
                      <CardBody className="grid gap-3">
                        {selectedQuote.items.length ? (
                          selectedQuote.items.map((item) => (
                            <div
                              className="grid gap-3 border-b border-industrial-rail pb-3 text-sm sm:grid-cols-[1fr_auto]"
                              key={item.variantId}
                            >
                              <div>
                                <p className="font-black text-industrial-ink">
                                  {item.title}
                                </p>
                                <p className="text-xs font-semibold text-industrial-muted">
                                  {item.quantity} x {item.sku}
                                </p>
                                <p className="mt-1 text-xs text-industrial-steel">
                                  {Object.values(item.options || {})
                                    .filter(Boolean)
                                    .join(" / ") || "Standard option"}
                                </p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="font-black text-industrial-ink">
                                  {formatCurrency(item.price * item.quantity)}
                                </p>
                                <p className="text-xs text-industrial-muted">
                                  {formatCurrency(item.price)} each
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-industrial-steel">
                            Submitted checkout quote requests will show requested
                            products here.
                          </p>
                        )}
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                            Quote Math
                          </p>
                          <h3 className="text-lg font-black text-industrial-ink">
                            Estimate
                          </h3>
                        </div>
                      </CardHeader>
                      <CardBody className="grid gap-3 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-industrial-steel">Subtotal</span>
                          <strong>{formatCurrency(getQuoteSubtotal(selectedQuote))}</strong>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-industrial-steel">Delivery</span>
                          <strong>
                            {formatCurrency(
                              selectedQuote.fulfillmentMethod === "delivery" &&
                                getQuoteSubtotal(selectedQuote) < 500
                                ? 85
                                : 0
                            )}
                          </strong>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-industrial-steel">
                            Tax after approval
                          </span>
                          <strong>
                            {selectedQuote.status === "confirmed"
                              ? formatCurrency(getQuoteSubtotal(selectedQuote) * taxRate)
                              : "Pending"}
                          </strong>
                        </div>
                        <div className="border-t border-industrial-rail pt-3">
                          <div className="flex justify-between gap-4 text-lg">
                            <span className="font-black text-industrial-ink">
                              Total
                            </span>
                            <strong>{formatCurrency(getQuotedTotal(selectedQuote))}</strong>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-black text-industrial-ink">
                          Jobsite and request notes
                        </h3>
                      </CardHeader>
                      <CardBody className="text-sm leading-6 text-industrial-steel">
                        <p className="font-black text-industrial-ink">
                          {selectedQuote.jobsiteAddress.addressLine1 || "Pickup at yard"}
                        </p>
                        {selectedQuote.jobsiteAddress.addressLine2 ? (
                          <p>{selectedQuote.jobsiteAddress.addressLine2}</p>
                        ) : null}
                        <p>
                          {[
                            selectedQuote.jobsiteAddress.city,
                            selectedQuote.jobsiteAddress.state,
                            selectedQuote.jobsiteAddress.postalCode
                          ]
                            .filter(Boolean)
                            .join(" ") || "No delivery address supplied."}
                        </p>
                        <p className="mt-3">
                          {selectedQuote.jobsiteAddress.notes || "No notes provided."}
                        </p>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-black text-industrial-ink">
                          Staff pricing note
                        </h3>
                      </CardHeader>
                      <CardBody>
                        <Textarea
                          onChange={(event) => setStaffNote(event.target.value)}
                          value={staffNote}
                        />
                      </CardBody>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-black text-industrial-ink">
                        Customer drawings
                      </h3>
                    </CardHeader>
                    <CardBody className="grid gap-3">
                      {selectedQuote.drawings.length ? (
                        selectedQuote.drawings.map((drawing) => (
                          <div
                            className="grid gap-2 border border-industrial-rail p-3 sm:grid-cols-[1fr_auto]"
                            key={drawing.id}
                          >
                            <div className="min-w-0">
                              <p className="truncate font-black text-industrial-ink">
                                {drawing.fileName}
                              </p>
                              <p className="text-xs font-semibold text-industrial-muted">
                                {drawing.fileType} /{" "}
                                {(drawing.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            {drawing.publicUrl ? (
                              <a
                                className="inline-flex h-9 items-center justify-center border border-industrial-ink px-3 text-xs font-black uppercase tracking-[0.08em] text-industrial-ink"
                                href={drawing.publicUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Open
                              </a>
                            ) : (
                              <span className="self-center text-xs font-black uppercase tracking-[0.08em] text-industrial-muted">
                                Metadata saved
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-industrial-steel">
                          No customer drawings attached.
                        </p>
                      )}
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-black text-industrial-ink">
                        Activity
                      </h3>
                    </CardHeader>
                    <CardBody className="grid gap-3">
                      {selectedQuote.activity.map((event) => (
                        <div className="border border-industrial-rail p-3" key={event.id}>
                          <p className="font-black text-industrial-ink">
                            {event.label}
                          </p>
                          <p className="mt-1 text-sm text-industrial-steel">
                            {event.detail}
                          </p>
                        </div>
                      ))}
                    </CardBody>
                  </Card>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() =>
                        persistQuoteStatus(
                          selectedQuote.id,
                          "confirmed",
                          "Quote approved with pricing and ready to send."
                        )
                      }
                      variant="primary"
                    >
                      <CheckCircle2 size={16} />
                      Approve quote
                    </Button>
                    <Button
                      onClick={() =>
                        persistQuoteStatus(
                          selectedQuote.id,
                          "submitted",
                          "Quote marked ready for customer send-out."
                        )
                      }
                    >
                      <Send size={16} />
                      Mark ready to send
                    </Button>
                    <Button
                      onClick={() => convertQuoteToOrder(selectedQuote)}
                    >
                      <PackageCheck size={16} />
                      Convert to order
                    </Button>
                    <Button
                      onClick={() =>
                        persistQuoteStatus(
                          selectedQuote.id,
                          "cancelled",
                          "Quote declined or voided from quote desk."
                        )
                      }
                      variant="danger"
                    >
                      Decline
                    </Button>
                    <Button onClick={() => openEmailPreview(selectedQuote)}>
                      <Mail size={16} />
                      Email preview
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </section>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
