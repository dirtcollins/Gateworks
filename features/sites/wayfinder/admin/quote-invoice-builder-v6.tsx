"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SyntheticEvent,
  useMemo,
  useRef,
  useState
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Mail,
  Minus,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import { products } from "@/lib/catalog";
import { customerDirectory } from "@/lib/customers";
import { saveInvoice } from "@/lib/invoices-data";
import { calculateTax } from "@/lib/tax";
import { saveQuote, type QuoteItemInput, type QuoteStatus } from "@/lib/quotes-data";
import { useOverlayLayer } from "@/lib/use-overlay-layer";
import type { CustomerRecord } from "@/lib/customers";
import type { Product } from "@/lib/types";
import { PageHead } from "./admin-kit";
import { fmt } from "../kit";

type BuilderMode = "quote" | "invoice";

type BuilderLine = {
  key: string;
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  options: Record<string, string | undefined>;
  quantity: number;
  unitPrice: number;
};

type Props = {
  mode: BuilderMode;
};

const productPhotoFallback = "/assets/ui/product-photo-fallback.svg";
const tubeThicknessLabels = ["14 Gauge", "16 Gauge", "18 Gauge", "3/16", "1/8", "1/4"];
const tubeLengthLabels = ["20 ft", "24 ft"];
const genericVariantValues = new Set([
  "adjustable",
  "aluminum",
  "bag",
  "black oxide",
  "bonded",
  "brass",
  "can",
  "carbide",
  "chrome",
  "compact",
  "concrete",
  "cushion grip",
  "duplex",
  "each",
  "fast set",
  "frame",
  "galvanized",
  "gray",
  "green",
  "heavy duty",
  "impact",
  "interior",
  "kit",
  "led",
  "metal",
  "mix",
  "multi-bit",
  "nm-b",
  "poly",
  "pro grade",
  "red",
  "set",
  "single pole",
  "stone",
  "tan",
  "tool",
  "tube",
  "white",
  "yellow",
  "yellow jacket",
  "zinc"
]);

const termsByMode: Record<BuilderMode, string> = {
  quote: "Net 15",
  invoice: "Due on receipt"
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function futureInputValue(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function pickVariant(product: Product) {
  return (
    product.variants.find((variant) => variant.inventory === "in_stock") ||
    product.variants[0]
  );
}

function optionLabel(options: Record<string, string | undefined>) {
  const values = Object.values(options).filter(Boolean);
  return values.length ? values.join(" / ") : "Standard";
}

function customerLabel(customer: CustomerRecord) {
  return customer.company || customer.name;
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/in(ch|ches)?/g, "")
    .replace(/\s*x\s*/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

function compactSearch(value: string) {
  return normalizeSearch(value).replace(/[^a-z0-9./]+/g, "");
}

function scoreProduct(product: Product, query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return 1;
  const haystack = normalizeSearch(
    [
      product.title,
      product.category.name,
      product.description,
      ...product.details,
      ...Object.values(product.specifications)
    ].join(" ")
  );
  const variantText = normalizeSearch(
    product.variants
      .map(
        (variant) =>
          `${variant.sku} ${optionLabel(variant.options)} ${variant.options.length || ""} ${variant.options.wall || ""}`
      )
      .join(" ")
  );
  if (haystack.includes(normalized) || variantText.includes(normalized)) return 100;
  const compactHaystack = compactSearch(`${haystack} ${variantText}`);
  const compactQuery = compactSearch(query);
  if (compactHaystack.includes(compactQuery)) return 80;
  return normalized
    .split(" ")
    .filter(Boolean)
    .reduce((sum, token) => {
      const compactToken = compactSearch(token);
      return sum + (haystack.includes(token) || compactHaystack.includes(compactToken) ? 1 : 0);
    }, 0);
}

function scoreCustomer(customer: CustomerRecord, query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return 1;
  const haystack = normalizeSearch(
    `${customer.name} ${customer.company} ${customer.email} ${customer.phone}`
  );
  const compactHaystack = compactSearch(haystack);
  const compactQuery = compactSearch(query);
  if (haystack.includes(normalized) || compactHaystack.includes(compactQuery)) return 100;
  return normalized
    .split(" ")
    .filter(Boolean)
    .reduce(
      (sum, token) =>
        sum +
        (haystack.includes(token) || compactHaystack.includes(compactSearch(token)) ? 1 : 0),
      0
    );
}

function productImage(product: Product, variantId?: string) {
  const variant = variantId
    ? product.variants.find((item) => item.id === variantId)
    : product.variants[0];
  const source =
    variant?.image ||
    product.images[0]?.sizes?.thumb ||
    product.images[0]?.sizes?.card ||
    product.images[0]?.url ||
    productPhotoFallback;

  if (source.includes("images.national-hardware.com/is/image/nh/")) {
    const imageId = source.split("/").pop()?.split("?")[0];
    if (imageId) return `/assets/product-images-v6/Small/${imageId}-sm.webp`;
  }

  return source;
}

function setProductImageFallback(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = productPhotoFallback;
}

function findProduct(productId: string) {
  return products.find((product) => product.id === productId);
}

function findVariant(product: Product | undefined, variantId: string) {
  return product?.variants.find((variant) => variant.id === variantId) || product?.variants[0];
}

function isMeaningfulVariantValue(value?: string) {
  const normalized = value?.trim();
  if (!normalized || normalized === "-") return false;
  const searchValue = normalizeSearch(normalized);
  if (!searchValue || genericVariantValues.has(searchValue)) return false;
  if (normalized.includes("_")) return false;
  return true;
}

function displayVariantValue(value?: string) {
  return isMeaningfulVariantValue(value) ? value!.trim() : "-";
}

function uniqueVariantValues(product: Product, key: "length" | "wall" | "finish" | "color") {
  return Array.from(
    new Set(
      product.variants
        .map((variant) => variant.options[key])
        .filter((value): value is string => Boolean(value))
    )
  );
}

function sizeValues(product: Product) {
  return Array.from(
    new Set(
      product.variants
        .flatMap((variant) => [
          variant.options.length,
          variant.options.wall,
          variant.options.finish,
          variant.options.color
        ])
        .filter((value): value is string => Boolean(value))
        .filter(isMeaningfulVariantValue)
    )
  );
}

function isTube(product: Product) {
  return `${product.title} ${product.category.name}`.toLowerCase().includes("tube");
}

function variantFieldOptions(
  product: Product,
  field: "size" | "length" | "wall",
  fallback?: string
) {
  if (field === "wall" && isTube(product)) return tubeThicknessLabels;
  if (field === "length" && isTube(product)) return tubeLengthLabels;
  const values =
    field === "size"
      ? sizeValues(product)
      : uniqueVariantValues(product, field).filter(isMeaningfulVariantValue);
  return values.length ? values : [displayVariantValue(fallback)];
}

function variantValue(options: string[], value?: string) {
  const displayValue = displayVariantValue(value);
  return options.includes(displayValue) ? displayValue : options[0] || "-";
}

function bestVariantMatch(
  product: Product,
  currentVariantId: string,
  match: Partial<Record<"size" | "length" | "wall", string>>
) {
  const currentVariant = findVariant(product, currentVariantId);
  const normalizedMatch = {
    length: match.length === "-" ? undefined : match.length,
    wall: match.wall === "-" ? undefined : match.wall,
    size: match.size === "-" ? undefined : match.size
  };

  return (
    product.variants.find((variant) => {
      const variantSizeValues = [
        variant.options.length,
        variant.options.wall,
        variant.options.finish,
        variant.options.color
      ].filter(Boolean);
      return (
        (!normalizedMatch.length || variant.options.length === normalizedMatch.length) &&
        (!normalizedMatch.wall || variant.options.wall === normalizedMatch.wall) &&
        (!normalizedMatch.size || variantSizeValues.includes(normalizedMatch.size))
      );
    }) ||
    currentVariant ||
    product.variants[0]
  );
}

function buildLineInputs(lines: BuilderLine[]): QuoteItemInput[] {
  return lines.map((line) => ({
    productId: line.productId,
    variantId: line.variantId,
    sku: line.sku,
    title: line.title,
    options: line.options,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineTotal: Number((line.quantity * line.unitPrice).toFixed(2))
  }));
}

export function WayfinderQuoteInvoiceBuilderV6({ mode }: Props) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [query, setQuery] = useState("");
  const [lineRows, setLineRows] = useState<BuilderLine[]>([]);
  const [documentDate, setDocumentDate] = useState(todayInputValue);
  const [secondaryDate, setSecondaryDate] = useState(() =>
    futureInputValue(mode === "quote" ? 15 : 0)
  );
  const [terms, setTerms] = useState(termsByMode[mode]);
  const [notes, setNotes] = useState(
    mode === "quote"
      ? "Pricing is valid through the expiration date and subject to stock availability."
      : "Thank you for your business."
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const customerPicker = useOverlayLayer("quote-builder-customer", () =>
    setCustomerSearch("")
  );
  const itemPicker = useOverlayLayer("quote-builder-products", () => setQuery(""));
  const productSearchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedCustomer =
    customerDirectory.find((customer) => customer.id === customerId) || null;

  const subtotal = lineRows.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  const searchResults = useMemo(() => {
    const source = products
      .map((product) => ({ product, score: scoreProduct(product, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.product.title.localeCompare(b.product.title))
      .map(({ product }) => product);

    return source.slice(0, 30);
  }, [query]);
  const customerOptions = useMemo(
    () =>
      customerDirectory
        .map((customer) => ({ customer, score: scoreCustomer(customer, customerSearch) }))
        .filter(({ score }) => score > 0)
        .sort(
          (a, b) =>
            b.score - a.score ||
            customerLabel(a.customer).localeCompare(customerLabel(b.customer))
        )
        .map(({ customer }) => customer),
    [customerSearch]
  );

  const heading = mode === "quote" ? "Quote Builder" : "Invoice Builder";
  const documentLabel = mode === "quote" ? "Quote" : "Invoice";
  const saveLabel = mode === "quote" ? "Save draft" : "Create invoice";
  const sendLabel = mode === "quote" ? "Save & send" : "Create & send";

  function addProduct(product: Product) {
    const variant = pickVariant(product);
    if (!variant) return;

    setLineRows((current) => {
      const existing = current.find((line) => line.variantId === variant.id);
      if (existing) {
        return current.map((line) =>
          line.variantId === variant.id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }

      return [
        ...current,
        {
          key: `${variant.id}-${Date.now()}`,
          productId: product.id,
          variantId: variant.id,
          sku: variant.sku,
          title: product.title,
          options: variant.options || {},
          quantity: 1,
          unitPrice: variant.price
        }
      ];
    });
    setQuery("");
    itemPicker.closeLayer();
    productSearchInputRef.current?.blur();
  }

  function updateLineVariant(
    variantId: string,
    match: Partial<Record<"size" | "length" | "wall", string>>
  ) {
    setLineRows((current) =>
      current.map((line) => {
        if (line.variantId !== variantId) return line;
        const product = findProduct(line.productId);
        if (!product) return line;
        const nextVariant = bestVariantMatch(product, line.variantId, match);
        if (!nextVariant) return line;
        return {
          ...line,
          variantId: nextVariant.id,
          sku: nextVariant.sku,
          options: nextVariant.options || {},
          unitPrice: nextVariant.price
        };
      })
    );
  }

  function handleProductSearchPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    if (itemPicker.open) {
      itemPicker.closeLayer();
      productSearchInputRef.current?.blur();
      return;
    }
    itemPicker.openLayer();
    requestAnimationFrame(() => productSearchInputRef.current?.focus());
  }

  function updateQuantity(variantId: string, quantity: number) {
    setLineRows((current) =>
      current.map((line) =>
        line.variantId === variantId
          ? { ...line, quantity: Math.max(1, quantity) }
          : line
      )
    );
  }

  function updateUnitPrice(variantId: string, unitPrice: number) {
    setLineRows((current) =>
      current.map((line) =>
        line.variantId === variantId
          ? { ...line, unitPrice: Math.max(0, unitPrice) }
          : line
      )
    );
  }

  function removeLine(variantId: string) {
    setLineRows((current) =>
      current.filter((line) => line.variantId !== variantId)
    );
  }

  async function persist(status: QuoteStatus) {
    if (busy) return;
    if (!selectedCustomer) {
      setMessage("Select a customer before saving this quote.");
      customerPicker.openLayer();
      return;
    }
    setBusy(true);
    setMessage("");

    if (mode === "invoice") {
      const result = await saveInvoice({
        status: status === "invoiced" ? "sent" : "draft",
        paymentStatus: "unpaid",
        customerId: selectedCustomer.id,
        customerName: customerLabel(selectedCustomer),
        customerEmail: selectedCustomer.email,
        billingAddress: selectedCustomer.billingAddress,
        jobsiteAddress: selectedCustomer.jobsiteAddress,
        terms,
        notes: [
          notes.trim(),
          `Invoice date: ${documentDate}`,
          `Due: ${secondaryDate}`
        ]
          .filter(Boolean)
          .join("\n"),
        subtotal,
        tax,
        deliveryFee: 0,
        total,
        amountPaid: 0,
        dueAt: secondaryDate ? new Date(`${secondaryDate}T12:00:00`).toISOString() : null,
        sentAt: status === "invoiced" ? new Date().toISOString() : null,
        items: buildLineInputs(lineRows)
      });

      setBusy(false);
      if (result.invoice) {
        router.push(`/admin/invoices/${encodeURIComponent(result.invoice.id)}`);
        return;
      }

      setMessage(
        result.persisted
          ? "Invoice saved, but the detail record could not be loaded."
          : result.reason || "Invoice was not persisted. Check Supabase configuration before relying on this record."
      );
      return;
    }

    const result = await saveQuote({
      status,
      customerId: selectedCustomer.id,
      customerName: customerLabel(selectedCustomer),
      customerEmail: selectedCustomer.email,
      billingAddress: selectedCustomer.billingAddress,
      jobsiteAddress: selectedCustomer.jobsiteAddress,
      terms,
      notes: [
        notes.trim(),
        `${documentLabel} date: ${documentDate}`,
        `${mode === "quote" ? "Expires" : "Due"}: ${secondaryDate}`
      ]
        .filter(Boolean)
        .join("\n"),
      subtotal,
      tax,
      total,
      createdBy: "Counter staff",
      items: buildLineInputs(lineRows)
    });

    setBusy(false);
    if (result.quote) {
      router.push(`/admin/quotes/${encodeURIComponent(result.quote.id)}`);
      return;
    }

    setMessage(
      result.persisted
        ? `${documentLabel} saved, but the detail record could not be loaded.`
        : `${documentLabel} was not persisted. Check Supabase configuration before relying on this record.`
    );
  }

  return (
    <section className="gwStripeBuilder">
      <header className="gwStripeHeader">
        <div className="gwStripeTitleStack">
          <button
            className="gwStripeBack"
            type="button"
            onClick={() => router.push("/admin/quotes")}
          >
            <ArrowLeft size={15} /> Quotes
          </button>
          <PageHead
            eyebrow="V6 Stripe-inspired"
            title={heading}
            desc="Fast customer setup, clean line-item controls, and payment-ready totals in one operational workspace."
          />
        </div>
        <div className="gwStripeActions">
          <button
            className="gwStripeGhost"
            type="button"
            onClick={() => void persist(mode === "quote" ? "draft" : "invoiced")}
            disabled={busy || !selectedCustomer || (mode === "invoice" && lineRows.length === 0)}
          >
            {saveLabel}
          </button>
          <button
            className="gwStripePrimary"
            type="button"
            onClick={() => void persist(mode === "quote" ? "sent" : "invoiced")}
            disabled={busy || !selectedCustomer || lineRows.length === 0}
          >
            <Mail size={15} /> {sendLabel}
          </button>
          <div className="gwStripeStatus">
            <CheckCircle2 size={16} /> {lineRows.length} line
            {lineRows.length === 1 ? "" : "s"}
          </div>
        </div>
      </header>

      {message ? <div className="gwStripeNotice">{message}</div> : null}

      <div className="gwStripeShell">
        <main className="gwStripeMain">
          <section
            className="gwStripeCard gwStripeMetaCard"
            style={customerPicker.open ? customerPicker.hostStyle : undefined}
          >
            <div className="gwStripeMetaGrid">
              <div
                className="gwStripeField gwStripeCustomerField"
                ref={customerPicker.containerRef as RefObject<HTMLDivElement>}
                style={customerPicker.hostStyle}
              >
                <label>Customer</label>
                <button
                  className="gwStripeSelect"
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    customerPicker.toggleLayer();
                  }}
                  aria-expanded={customerPicker.open}
                >
                  <span>
                    <strong>
                      {selectedCustomer ? customerLabel(selectedCustomer) : "Select customer"}
                    </strong>
                    <small>
                      {selectedCustomer
                        ? selectedCustomer.email
                        : "No customer selected"}
                    </small>
                  </span>
                  <ChevronDown size={16} />
                </button>
                {customerPicker.open ? (
                  <div className="gwStripeCustomerMenu" style={customerPicker.overlayStyle}>
                    <div className="gwStripeDropdownSearch">
                      <Search size={17} />
                      <input
                        value={customerSearch}
                        onChange={(event) => setCustomerSearch(event.target.value)}
                        placeholder="Type a customer name"
                        autoFocus
                      />
                    </div>
                    <div className="gwStripeDropdownOptions">
                      {customerOptions.length ? (
                        customerOptions.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => {
                              setCustomerId(customer.id);
                              setTerms(customer.terms || termsByMode[mode]);
                              customerPicker.closeLayer();
                            }}
                          >
                            <strong>{customerLabel(customer)}</strong>
                            <small>
                              {customer.name} · {customer.phone || "No phone"} ·{" "}
                              {customer.terms}
                            </small>
                          </button>
                        ))
                      ) : (
                        <div className="gwStripeDropdownEmpty">No customers found</div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="gwStripeDateGrid">
                <label>
                  {documentLabel} date
                  <input
                    type="date"
                    value={documentDate}
                    onChange={(event) => setDocumentDate(event.target.value)}
                  />
                </label>
                <label>
                  {mode === "quote" ? "Expires" : "Due"}
                  <input
                    type="date"
                    value={secondaryDate}
                    onChange={(event) => setSecondaryDate(event.target.value)}
                  />
                </label>
              </div>

              <div className="gwStripeDocId">
                <span>{documentLabel} #</span>
                <strong>Auto</strong>
              </div>
            </div>
          </section>

          <section
            className="gwStripeCard gwStripeLinesCard"
            style={itemPicker.open ? itemPicker.hostStyle : undefined}
          >
            <div
              className="gwStripeItemPicker"
              ref={itemPicker.containerRef as RefObject<HTMLDivElement>}
              style={itemPicker.hostStyle}
            >
              <div
                className="gwStripeSearchBox"
                onPointerDown={handleProductSearchPointerDown}
              >
                <Search size={17} />
                <input
                  ref={productSearchInputRef}
                  value={query}
                  onFocus={() => itemPicker.openLayer()}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") itemPicker.closeLayer();
                  }}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    itemPicker.openLayer();
                  }}
                  placeholder="Search products by name, SKU, or scan barcode..."
                />
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    itemPicker.toggleLayer();
                  }}
                >
                  Browse products
                </button>
              </div>

              {itemPicker.open ? (
                <div
                  className="gwStripeProductMenu"
                  role="listbox"
                  style={itemPicker.overlayStyle}
                >
                  {searchResults.map((product) => {
                    const variant = pickVariant(product);
                    return (
                      <button
                        className="gwStripeProductOption"
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                      >
                        <img
                          src={productImage(product, variant?.id)}
                          alt=""
                          onError={setProductImageFallback}
                        />
                        <span>
                          <strong>{product.title}</strong>
                          <small>
                            {product.category.name} <em>·</em>{" "}
                            {variant?.sku || "No SKU"} <em>·</em>{" "}
                            <mark>In Stock</mark>
                          </small>
                        </span>
                        <b>{fmt(variant?.price || product.price)}</b>
                      </button>
                    );
                  })}
                  <div className="gwStripeProductFooter">
                    <span>Type to filter</span>
                    <span>esc to close</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="gwStripeTable" aria-label={`${documentLabel} line items`}>
              <div className="gwStripeTableHead">
                <span>Product</span>
                <span>Size</span>
                <span>Length</span>
                <span>Thickness</span>
                <span>Qty</span>
                <span>Unit</span>
                <span>Total</span>
                <span />
              </div>

              {lineRows.length ? (
                lineRows.map((line) => {
                  const product = findProduct(line.productId);
                  const variant = findVariant(product, line.variantId);
                  const sizeOptions = product
                    ? variantFieldOptions(product, "size", optionLabel(line.options))
                    : ["-"];
                  const lengthOptions = product
                    ? variantFieldOptions(product, "length", variant?.options.length)
                    : ["-"];
                  const wallOptions = product
                    ? variantFieldOptions(product, "wall", variant?.options.wall)
                    : ["-"];

                  return (
                    <div className="gwStripeLine" key={line.key}>
                    <div className="gwStripeProductCell">
                      {product ? (
                        <img
                          src={productImage(product, line.variantId)}
                          alt=""
                          onError={setProductImageFallback}
                        />
                      ) : null}
                      <div>
                        <strong>{line.title}</strong>
                        <small>
                          {line.sku} · {optionLabel(line.options)}
                        </small>
                        <em>In Stock</em>
                      </div>
                    </div>
                    <select
                      aria-label={`${line.title} size`}
                      value={variantValue(sizeOptions, optionLabel(line.options))}
                      onChange={(event) =>
                        updateLineVariant(line.variantId, { size: event.target.value })
                      }
                    >
                      {sizeOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                    <select
                      aria-label={`${line.title} length`}
                      value={variantValue(lengthOptions, variant?.options.length)}
                      onChange={(event) =>
                        updateLineVariant(line.variantId, { length: event.target.value })
                      }
                    >
                      {lengthOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                    <select
                      aria-label={`${line.title} thickness`}
                      value={variantValue(wallOptions, variant?.options.wall)}
                      onChange={(event) =>
                        updateLineVariant(line.variantId, { wall: event.target.value })
                      }
                    >
                      {wallOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                    <div className="gwStripeQty">
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                        aria-label={`Decrease ${line.title} quantity`}
                      >
                        <Minus size={13} />
                      </button>
                      <input
                        value={line.quantity}
                        inputMode="numeric"
                        onChange={(event) =>
                          updateQuantity(line.variantId, Number(event.target.value) || 1)
                        }
                        aria-label={`${line.title} quantity`}
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                        aria-label={`Increase ${line.title} quantity`}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <div className="gwStripeMoneyInput">
                      <span>$</span>
                      <input
                        value={line.unitPrice}
                        inputMode="decimal"
                        onChange={(event) =>
                          updateUnitPrice(
                            line.variantId,
                            Number(event.target.value) || 0
                          )
                        }
                        aria-label={`${line.title} unit price`}
                      />
                    </div>
                    <strong className="gwStripeLineTotal">
                      {fmt(line.quantity * line.unitPrice)}
                    </strong>
                    <button
                      className="gwStripeIconButton"
                      type="button"
                      onClick={() => removeLine(line.variantId)}
                      aria-label={`Remove ${line.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  );
                })
              ) : (
                <div className="gwStripeEmpty">
                  Search the catalog and add products to start this {mode}.
                </div>
              )}
            </div>
          </section>
        </main>

        <aside className="gwStripeRail">
          <section className="gwStripeSummary">
            <h2>{documentLabel} summary</h2>
            <div className="gwStripeTotals">
              <p>
                <span>Subtotal</span>
                <strong>{fmt(subtotal)}</strong>
              </p>
              <p>
                <span>Tax</span>
                <strong>{fmt(tax)}</strong>
              </p>
              <p className="total">
                <span>Amount due</span>
                <strong>{fmt(total)}</strong>
              </p>
            </div>
            <label>
              Terms
              <input
                value={terms}
                onChange={(event) => setTerms(event.target.value)}
              />
            </label>
            <label>
              Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={5}
              />
            </label>
          </section>

          <section className="gwStripeInsight">
            <span>Payment terms</span>
            <strong>{terms || termsByMode[mode]}</strong>
            <p>
              {mode === "quote"
                ? "Quotes save into the existing pipeline and can still be converted from the detail page."
                : "Invoices save as real invoice records with their own invoice number, status, payment state, and line items."}
            </p>
          </section>
        </aside>
      </div>

      <style jsx>{`
        .gwStripeBuilder {
          --stripe-bg: #f6f9fc;
          --stripe-panel: rgba(255, 255, 255, 0.92);
          --stripe-line: #d9e2ec;
          --stripe-text: #0a2540;
          --stripe-muted: #425466;
          --stripe-accent: #533afd;
          min-height: calc(100vh - 80px);
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          margin: 0;
          padding: 0 0 40px;
          background: var(--stripe-bg);
          color: var(--stripe-text);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .gwStripeHeader {
          display: grid;
          grid-template-columns: minmax(0, 650px) minmax(360px, 1fr);
          gap: 40px;
          width: 100%;
          max-width: none;
          margin: 0 0 34px;
          align-items: start;
        }

        .gwStripeTitleStack {
          display: grid;
          gap: 12px;
        }

        .gwStripeBack,
        .gwStripeGhost,
        .gwStripePrimary,
        .gwStripeIconButton,
        .gwStripeQty button,
        .gwStripeCustomerMenu button,
        .gwStripeProductMenu button,
        .gwStripeSearchBox button,
        .gwStripeSelect {
          font: inherit;
          cursor: pointer;
        }

        .gwStripeBack {
          width: max-content;
          border: 0;
          background: transparent;
          color: var(--stripe-muted);
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0;
          font-size: 13px;
          font-weight: 600;
        }

        .gwStripeActions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 4px;
        }

        .gwStripeGhost,
        .gwStripePrimary {
          min-height: 47px;
          border: 0;
          border-radius: 4px;
          padding: 0 20px;
          background: rgba(255, 255, 255, 0.82);
          color: var(--stripe-accent);
          box-shadow: 0 1px 2px rgba(10, 37, 64, 0.08);
          font-size: 14px;
          font-weight: 600;
        }

        .gwStripePrimary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--stripe-accent);
          color: #ffffff;
        }

        .gwStripePrimary:disabled,
        .gwStripeGhost:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .gwStripeStatus {
          display: inline-flex;
          min-height: 47px;
          align-items: center;
          gap: 7px;
          color: var(--stripe-text);
          font-size: 14px;
          font-weight: 600;
        }

        .gwStripeNotice {
          width: 100%;
          max-width: none;
          margin: 0 0 18px;
          border: 1px solid rgba(83, 58, 253, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.86);
          color: var(--stripe-muted);
          padding: 12px 14px;
          font-size: 13px;
        }

        .gwStripeShell {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(340px, 390px);
          gap: 26px;
          width: 100%;
          max-width: none;
          margin: 0;
          align-items: start;
          overflow: visible;
        }

        .gwStripeMain,
        .gwStripeRail {
          display: grid;
          gap: 22px;
          min-width: 0;
        }

        .gwStripeCard,
        .gwStripeSummary,
        .gwStripeInsight {
          min-width: 0;
          border: 1px solid rgba(217, 226, 236, 0.9);
          border-radius: 8px;
          background: var(--stripe-panel);
          box-shadow: 0 30px 70px rgba(10, 37, 64, 0.12);
          backdrop-filter: blur(18px);
        }

        .gwStripeMetaCard {
          padding: 28px;
        }

        .gwStripeMetaGrid {
          display: grid;
          grid-template-columns: minmax(240px, 1.25fr) minmax(300px, 1fr) minmax(110px, 150px);
          gap: 22px;
          align-items: end;
          min-width: 0;
        }

        .gwStripeField,
        .gwStripeDateGrid label,
        .gwStripeSummary label {
          display: grid;
          gap: 8px;
          color: var(--stripe-text);
          font-size: 13px;
          font-weight: 600;
        }

        .gwStripeCustomerField {
          position: relative;
        }

        .gwStripeSelect,
        .gwStripeDateGrid input,
        .gwStripeSearchBox,
        .gwStripeSummary input,
        .gwStripeSummary textarea,
        .gwStripeMoneyInput,
        .gwStripeQty {
          border: 1px solid #cfd7df;
          border-radius: 4px;
          background: #ffffff;
          color: var(--stripe-text);
          box-shadow: 0 1px 1px rgba(10, 37, 64, 0.04);
        }

        .gwStripeSelect {
          min-height: 50px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 12px;
          text-align: left;
        }

        .gwStripeSelect span,
        .gwStripeProductMenu button span {
          display: grid;
          gap: 3px;
          min-width: 0;
        }

        .gwStripeSelect strong,
        .gwStripeProductCell strong,
        .gwStripeProductMenu strong {
          overflow: hidden;
          color: var(--stripe-text);
          font-size: 14px;
          font-weight: 600;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .gwStripeSelect small,
        .gwStripeProductCell small,
        .gwStripeProductMenu small {
          overflow: hidden;
          color: var(--stripe-muted);
          font-size: 12px;
          font-weight: 400;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .gwStripeCustomerMenu {
          position: absolute;
          z-index: 3000;
          left: 0;
          right: 0;
          top: calc(100% + 8px);
          display: grid;
          max-height: 310px;
          overflow: auto;
          border: 1px solid var(--stripe-line);
          border-radius: 6px;
          background: #ffffff;
          box-shadow: 0 28px 65px rgba(10, 37, 64, 0.22);
        }

        .gwStripeDropdownSearch {
          display: flex;
          min-height: 48px;
          align-items: center;
          gap: 9px;
          border-bottom: 1px solid var(--stripe-line);
          padding: 0 12px;
          color: var(--stripe-muted);
        }

        .gwStripeDropdownSearch input {
          min-width: 0;
          width: 100%;
          border: 0;
          outline: 0;
          color: var(--stripe-text);
          font: inherit;
          font-size: 14px;
        }

        .gwStripeDropdownOptions {
          display: grid;
          max-height: 250px;
          overflow: auto;
        }

        .gwStripeDropdownEmpty {
          padding: 18px 12px;
          color: var(--stripe-muted);
          font-size: 13px;
        }

        .gwStripeCustomerMenu button,
        .gwStripeProductMenu button {
          border: 0;
          background: #ffffff;
          color: var(--stripe-text);
          text-align: left;
        }

        .gwStripeCustomerMenu button {
          display: grid;
          gap: 3px;
          padding: 11px 12px;
        }

        .gwStripeCustomerMenu button:hover,
        .gwStripeProductMenu button:hover {
          background: var(--stripe-bg);
        }

        .gwStripeDateGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .gwStripeDateGrid input,
        .gwStripeSummary input,
        .gwStripeSummary textarea {
          min-height: 50px;
          padding: 0 12px;
          font: inherit;
        }

        .gwStripeSummary textarea {
          min-height: 120px;
          padding: 12px;
          resize: vertical;
        }

        .gwStripeDocId {
          display: grid;
          gap: 5px;
        }

        .gwStripeDocId span {
          color: var(--stripe-muted);
          font-size: 13px;
          font-weight: 600;
        }

        .gwStripeDocId strong {
          color: var(--stripe-text);
          font-size: 34px;
          font-weight: 500;
        }

        .gwStripeLinesCard {
          position: relative;
          z-index: 1;
          padding: 18px;
          overflow: visible;
        }

        .gwStripeItemPicker {
          position: relative;
          z-index: 2500;
          margin-bottom: 18px;
        }

        .gwStripeSearchBox {
          display: flex;
          min-height: 54px;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
        }

        .gwStripeSearchBox input {
          min-width: 0;
          width: 100%;
          border: 0;
          outline: 0;
          color: var(--stripe-text);
          font: inherit;
          font-size: 14px;
        }

        .gwStripeSearchBox button {
          height: 36px;
          border: 0;
          border-radius: 4px;
          background: var(--stripe-accent);
          color: #ffffff;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }

        .gwStripeSearchBox:focus-within,
        .gwStripeSelect:focus,
        .gwStripeDateGrid input:focus,
        .gwStripeLine select:focus,
        .gwStripeSummary input:focus,
        .gwStripeSummary textarea:focus,
        .gwStripeMoneyInput:focus-within,
        .gwStripeQty:focus-within {
          border-color: var(--stripe-accent);
          box-shadow: 0 0 0 3px rgba(83, 58, 253, 0.16);
          outline: 0;
        }

        .gwStripeProductMenu {
          position: absolute;
          z-index: 3000;
          left: 0;
          right: 0;
          top: calc(100% + 8px);
          display: grid;
          gap: 1px;
          max-height: 390px;
          overflow: auto;
          border: 1px solid var(--stripe-line);
          border-radius: 6px;
          background: var(--stripe-line);
          box-shadow: 0 28px 65px rgba(10, 37, 64, 0.22);
        }

        .gwStripeProductMenu button {
          display: flex;
          min-height: 68px;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 12px;
        }

        .gwStripeProductOption img {
          width: 48px;
          height: 48px;
          flex: 0 0 auto;
          border: 1px solid var(--stripe-line);
          border-radius: 6px;
          background: #f7f8fb;
          object-fit: contain;
        }

        .gwStripeProductOption span {
          flex: 1;
        }

        .gwStripeProductOption small em {
          color: #9aa6b2;
          font-style: normal;
        }

        .gwStripeProductOption mark {
          border-radius: 999px;
          background: #ecfdf3;
          color: #067647;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: 700;
        }

        .gwStripeProductMenu b {
          color: var(--stripe-text);
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .gwStripeProductFooter {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          background: #ffffff;
          border-top: 1px solid var(--stripe-line);
          color: var(--stripe-muted);
          padding: 9px 12px;
          font-size: 12px;
        }

        .gwStripeTable {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          border: 1px solid var(--stripe-line);
          border-radius: 6px;
          background: #ffffff;
        }

        .gwStripeTableHead,
        .gwStripeLine {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) 96px 96px 108px 124px 118px 90px 34px;
          gap: 8px;
          align-items: center;
          min-width: 940px;
        }

        .gwStripeTableHead {
          min-height: 46px;
          padding: 0 14px;
          background: var(--stripe-bg);
          color: var(--stripe-muted);
          font-size: 12px;
          font-weight: 600;
        }

        .gwStripeLine {
          min-height: 88px;
          border-top: 1px solid var(--stripe-line);
          padding: 12px;
          color: var(--stripe-text);
          font-size: 14px;
        }

        .gwStripeProductCell {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .gwStripeProductCell img {
          width: 48px;
          height: 48px;
          flex: 0 0 auto;
          border: 1px solid var(--stripe-line);
          border-radius: 6px;
          background: #f7f8fb;
          object-fit: contain;
        }

        .gwStripeProductCell div {
          display: grid;
          gap: 3px;
          min-width: 0;
        }

        .gwStripeProductCell em {
          width: max-content;
          border-radius: 999px;
          background: #ecfdf3;
          color: #067647;
          padding: 2px 7px;
          font-size: 11px;
          font-style: normal;
          font-weight: 700;
        }

        .gwStripeLine select {
          min-height: 38px;
          width: 100%;
          min-width: 0;
          border: 1px solid #cfd7df;
          border-radius: 4px;
          background: #ffffff;
          color: var(--stripe-text);
          font: inherit;
          font-size: 13px;
          padding: 0 8px;
        }

        .gwStripeQty {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) 34px;
          min-height: 38px;
          overflow: hidden;
        }

        .gwStripeQty button,
        .gwStripeIconButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          background: #ffffff;
          color: var(--stripe-muted);
        }

        .gwStripeQty input,
        .gwStripeMoneyInput input {
          min-width: 0;
          width: 100%;
          border: 0;
          outline: 0;
          color: var(--stripe-text);
          font: inherit;
          text-align: center;
        }

        .gwStripeQty input {
          border-inline: 1px solid var(--stripe-line);
        }

        .gwStripeMoneyInput {
          display: flex;
          min-height: 38px;
          align-items: center;
          gap: 4px;
          padding: 0 8px;
        }

        .gwStripeMoneyInput span {
          color: var(--stripe-muted);
          font-size: 13px;
        }

        .gwStripeMoneyInput input {
          text-align: left;
        }

        .gwStripeLineTotal {
          font-weight: 700;
        }

        .gwStripeIconButton {
          width: 36px;
          height: 36px;
          border-radius: 4px;
        }

        .gwStripeIconButton:hover {
          background: #fff1f2;
          color: #be123c;
        }

        .gwStripeEmpty {
          border-top: 1px solid var(--stripe-line);
          padding: 34px 16px;
          color: var(--stripe-muted);
          text-align: center;
          font-size: 14px;
        }

        .gwStripeSummary {
          position: sticky;
          top: 24px;
          z-index: 2;
          display: grid;
          gap: 18px;
          padding: 26px;
        }

        .gwStripeSummary h2 {
          margin: 0;
          color: var(--stripe-text);
          font-size: 22px;
          font-weight: 500;
        }

        .gwStripeTotals {
          display: grid;
        }

        .gwStripeTotals p {
          display: flex;
          min-height: 50px;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--stripe-line);
          margin: 0;
          color: var(--stripe-muted);
          font-size: 14px;
        }

        .gwStripeTotals strong {
          color: var(--stripe-text);
          font-weight: 600;
        }

        .gwStripeTotals .total {
          min-height: 74px;
          color: var(--stripe-text);
          font-size: 19px;
          font-weight: 600;
        }

        .gwStripeTotals .total strong {
          color: var(--stripe-accent);
          font-size: 34px;
          font-weight: 500;
        }

        .gwStripeInsight {
          display: grid;
          gap: 7px;
          padding: 20px 22px;
        }

        .gwStripeInsight span {
          color: var(--stripe-muted);
          font-size: 13px;
        }

        .gwStripeInsight strong {
          color: var(--stripe-text);
          font-size: 26px;
          font-weight: 500;
        }

        .gwStripeInsight p {
          margin: 0;
          color: var(--stripe-muted);
          font-size: 14px;
          line-height: 1.45;
        }

        @media (max-width: 1180px) {
          .gwStripeHeader,
          .gwStripeShell,
          .gwStripeMetaGrid {
            grid-template-columns: 1fr;
          }

          .gwStripeActions {
            justify-content: flex-start;
          }

          .gwStripeSummary {
            position: static;
          }
        }

        @media (max-width: 760px) {
          .gwStripeBuilder {
            padding: 0 0 32px;
          }

          .gwStripeDateGrid,
          .gwStripeRail {
            grid-template-columns: 1fr;
          }

          .gwStripeProductMenu button {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </section>
  );
}
