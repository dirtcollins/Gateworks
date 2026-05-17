// d11 "Wayfinder" - New Quote Builder.
// A functional quote workspace modeled after the Hostinger operations
// prototype, restyled for the Wayfinder design system.
"use client";

import { useMemo, useState } from "react";
import { popularProducts } from "@/features/design-lab/live-data";
import type { Product, ProductVariant } from "@/lib/types";
import {
  Btn,
  Card,
  D11Shell,
  Eyebrow,
  Ico,
  Mono,
  Qty,
  Tag,
  d11,
  fmt,
  monoFont,
  wayfinding
} from "./kit";

type Customer = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  terms: string;
  address: string;
};

type QuoteLine = {
  id: string;
  title: string;
  sku: string;
  productId: string;
  variantId: string;
  image: string;
  size: string;
  length: string;
  thickness: string;
  qty: number;
  unitPrice: number;
  custom?: boolean;
};

const quoteDate = "May 17, 2026";
const expiresDate = "May 30, 2026";

const customers: Customer[] = [
  {
    id: "valley",
    name: "Valley Ironworks",
    contact: "Owen Cruz",
    email: "orders@valleyiron.example",
    phone: "(559) 555-0205",
    terms: "Net 30",
    address: "Fresno, CA"
  },
  {
    id: "sanchez",
    name: "Sanchez Fence & Rail",
    contact: "Maria Sanchez",
    email: "maria@sanchezfence.example",
    phone: "(661) 555-0188",
    terms: "Net 15",
    address: "Bakersfield, CA"
  },
  {
    id: "miles",
    name: "Miles Custom Fab",
    contact: "Derek Miles",
    email: "shop@milesfab.example",
    phone: "(661) 555-0134",
    terms: "Due on receipt",
    address: "Delano, CA"
  },
  {
    id: "walk-in",
    name: "Walk-in Customer",
    contact: "Counter sale",
    email: "No email on file",
    phone: "No phone on file",
    terms: "Due on receipt",
    address: "Will-call counter"
  },
  {
    id: "kings",
    name: "Kings Gate & Fence",
    contact: "Priya Nair",
    email: "priya@kingsgate.example",
    phone: "(559) 555-0142",
    terms: "Net 30",
    address: "Hanford, CA"
  },
  {
    id: "clovis",
    name: "Clovis Custom Gates",
    contact: "Hector Ruiz",
    email: "hector@clovisgates.example",
    phone: "(559) 555-0191",
    terms: "Net 10",
    address: "Clovis, CA"
  }
];

function fieldStyle() {
  return {
    width: "100%",
    minWidth: 0,
    border: `1px solid ${d11.rail}`,
    background: "#fff",
    color: d11.ink,
    height: 42,
    padding: "0 12px",
    fontSize: 13,
    fontWeight: 700,
    outline: "none"
  };
}

function smallButton(active = false) {
  return {
    height: 34,
    border: `1px solid ${active ? d11.ink : d11.rail}`,
    background: active ? d11.ink : "#fff",
    color: active ? "#fff" : d11.ink,
    padding: "0 10px",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap" as const
  };
}

function variantLabel(variant: ProductVariant) {
  const parts = [
    variant.options.length,
    variant.options.wall,
    variant.options.finish
  ].filter((part) => part && part !== "Standard");
  return parts.length ? parts.join(" / ") : "Standard";
}

function sizeFromVariant(variant: ProductVariant) {
  return variant.options.material ?? variant.options.length ?? "Stock";
}

function lengthFromVariant(variant: ProductVariant) {
  return variant.options.length ?? (variant.length_ft ? `${variant.length_ft} ft` : "-");
}

function thicknessFromVariant(variant: ProductVariant) {
  return (
    variant.options.wall ??
    (variant.wall_thickness_in ? `${variant.wall_thickness_in}"` : "-")
  );
}

function makeLine(product: Product, variant: ProductVariant): QuoteLine {
  return {
    id: `${variant.id}-${Date.now()}`,
    title: product.title,
    sku: variant.sku,
    productId: product.id,
    variantId: variant.id,
    image: variant.image || product.images[0]?.url || "/assets/logo.svg",
    size: sizeFromVariant(variant),
    length: lengthFromVariant(variant),
    thickness: thicknessFromVariant(variant),
    qty: 1,
    unitPrice: variant.price
  };
}

function DetailTile({
  label,
  value,
  sub,
  action
}: {
  label: string;
  value: string;
  sub?: string;
  action?: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${d11.rail}`,
        background: d11.bone,
        padding: 12,
        minHeight: 82
      }}
    >
      <Mono style={{ fontSize: 10, color: d11.muted, display: "block" }}>
        {label}
      </Mono>
      <strong
        style={{
          display: "block",
          marginTop: 6,
          fontSize: 15,
          lineHeight: 1.25,
          color: d11.ink
        }}
      >
        {value}
      </strong>
      {sub ? (
        <span style={{ display: "block", marginTop: 4, fontSize: 12, color: d11.steel }}>
          {sub}
        </span>
      ) : null}
      {action ? (
        <button type="button" style={{ ...smallButton(), marginTop: 10 }}>
          {action}
        </button>
      ) : null}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  color
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span
        style={{
          color: bold ? d11.ink : d11.steel,
          fontSize: bold ? 13 : 12,
          fontWeight: bold ? 900 : 700,
          letterSpacing: bold ? "0.06em" : "normal",
          textTransform: bold ? "uppercase" : "none"
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: color ?? d11.ink,
          fontSize: bold ? 24 : 14,
          fontWeight: 900,
          fontFamily: monoFont
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function D11Cart() {
  const [selectedCustomerId, setSelectedCustomerId] = useState("valley");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("Q-2114");
  const [editingNumber, setEditingNumber] = useState(false);
  const [poRef, setPoRef] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [status, setStatus] = useState("Unsaved draft");
  const [note, setNote] = useState("");
  const [discountOpen, setDiscountOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [scanMode, setScanMode] = useState(false);

  const firstProduct = popularProducts[0];
  const secondProduct = popularProducts[1] ?? firstProduct;
  const initialLines = useMemo<QuoteLine[]>(() => {
    const firstVariant = firstProduct?.variants[0];
    const secondVariant = secondProduct?.variants[0];
    return [
      firstProduct && firstVariant ? makeLine(firstProduct, firstVariant) : null,
      secondProduct && secondVariant ? { ...makeLine(secondProduct, secondVariant), qty: 2 } : null
    ].filter((line): line is QuoteLine => Boolean(line));
  }, [firstProduct, secondProduct]);

  const [lines, setLines] = useState<QuoteLine[]>(initialLines);

  const selectedCustomer =
    customers.find((customer) => customer.id === selectedCustomerId) ?? customers[0];

  const filteredCustomers = customers.filter((customer) => {
    const haystack = `${customer.name} ${customer.contact}`.toLowerCase();
    return haystack.includes(customerQuery.toLowerCase());
  });

  const productChoices = popularProducts
    .flatMap((product) =>
      product.variants.slice(0, 2).map((variant) => ({ product, variant }))
    )
    .filter(({ product, variant }) => {
      const haystack = `${product.title} ${variant.sku} ${variantLabel(variant)}`.toLowerCase();
      return haystack.includes(productQuery.toLowerCase());
    })
    .slice(0, 8);

  const subtotal = lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
  const quoteTotal = Math.max(0, subtotal - discount + delivery);
  const unitCount = lines.reduce((sum, line) => sum + line.qty, 0);

  function updateLine(id: string, patch: Partial<QuoteLine>) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line))
    );
    setStatus("Unsaved draft");
  }

  function addProduct(product: Product, variant: ProductVariant) {
    setLines((current) => [...current, makeLine(product, variant)]);
    setPickerOpen(false);
    setProductQuery("");
    setStatus("Unsaved draft");
  }

  function addCustomItem() {
    setLines((current) => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        title: "Custom fabrication line",
        sku: "CUSTOM",
        productId: "custom",
        variantId: "custom",
        image: "/assets/logo.svg",
        size: "Field measure",
        length: "-",
        thickness: "-",
        qty: 1,
        unitPrice: 125,
        custom: true
      }
    ]);
    setStatus("Unsaved draft");
  }

  return (
    <D11Shell active="cart" cartCount={unitCount}>
      <style>{`
        @media (max-width: 980px) {
          .d11-quote-main { grid-template-columns: 1fr !important; }
          .d11-quote-detail-grid { grid-template-columns: 1fr 1fr !important; }
          .d11-line-header { display: none !important; }
          .d11-line-row { grid-template-columns: 1fr !important; }
          .d11-line-money { justify-items: start !important; }
        }
        @media (max-width: 640px) {
          .d11-quote-toolbar { align-items: stretch !important; }
          .d11-quote-toolbar > div { width: 100%; }
          .d11-quote-detail-grid { grid-template-columns: 1fr !important; }
          .d11-quote-actions { width: 100%; justify-content: stretch !important; }
          .d11-quote-actions button, .d11-quote-actions a { flex: 1; }
        }
      `}</style>

      <div style={{ padding: "20px 24px 44px", maxWidth: 1440, margin: "0 auto" }}>
        <div
          className="d11-quote-toolbar"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
            paddingBottom: 14,
            borderBottom: `1px solid ${d11.rail}`,
            flexWrap: "wrap"
          }}
        >
          <div>
            <Eyebrow>Quote</Eyebrow>
            <h1 style={{ fontSize: 30, fontWeight: 900, margin: 0 }}>
              New Quote Builder
            </h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <Tag tone="in">Draft</Tag>
              <Tag>{status}</Tag>
              <Mono style={{ fontSize: 10, color: d11.muted }}>WAYFINDER COUNTER</Mono>
            </div>
          </div>

          <div
            className="d11-quote-actions"
            style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}
          >
            <div style={{ position: "relative" }}>
              <Btn variant="default" onClick={() => setActionsOpen((open) => !open)}>
                More actions <Ico.chevronDown size={14} />
              </Btn>
              {actionsOpen ? (
                <Card
                  style={{
                    position: "absolute",
                    top: 44,
                    right: 0,
                    width: 210,
                    zIndex: 20,
                    padding: 8,
                    display: "grid",
                    gap: 4,
                    boxShadow: "0 18px 36px rgba(17,17,17,0.14)"
                  }}
                >
                  {["Duplicate quote", "Download PDF", "Convert to order", "Void draft"].map(
                    (action) => (
                      <button key={action} type="button" style={smallButton(false)}>
                        {action}
                      </button>
                    )
                  )}
                </Card>
              ) : null}
            </div>
            <Btn variant="default" onClick={() => setStatus("Saved draft")}>
              <Ico.check size={15} /> Save Quote
            </Btn>
            <Btn variant="primary" onClick={() => setStatus("Ready to send")}>
              Send Quote <Ico.arrowRight size={15} />
            </Btn>
          </div>
        </div>

        <div
          className="d11-quote-main"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 360px",
            gap: 18,
            marginTop: 18
          }}
        >
          <main style={{ display: "grid", gap: 16, minWidth: 0 }}>
            <Card style={{ padding: 16 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(260px, 1.2fr) 1fr",
                  gap: 14
                }}
                className="d11-quote-detail-grid"
              >
                <div style={{ position: "relative" }}>
                  <Mono style={{ fontSize: 10, color: d11.muted, display: "block" }}>
                    Customer
                  </Mono>
                  <button
                    type="button"
                    onClick={() => setCustomerOpen((open) => !open)}
                    style={{
                      ...fieldStyle(),
                      marginTop: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      height: 48
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Ico.user size={16} />
                      {selectedCustomer.name}
                    </span>
                    <Ico.chevronDown size={15} />
                  </button>
                  <p style={{ margin: "7px 0 0", fontSize: 12, color: d11.steel }}>
                    {selectedCustomer.contact} - {selectedCustomer.email} -{" "}
                    {selectedCustomer.phone}
                  </p>
                  {customerOpen ? (
                    <Card
                      style={{
                        position: "absolute",
                        top: 78,
                        left: 0,
                        right: 0,
                        zIndex: 25,
                        padding: 10,
                        boxShadow: "0 18px 36px rgba(17,17,17,0.14)"
                      }}
                    >
                      <input
                        value={customerQuery}
                        onChange={(event) => setCustomerQuery(event.target.value)}
                        placeholder="Type a customer name"
                        style={fieldStyle()}
                      />
                      <div style={{ display: "grid", gap: 4, marginTop: 8 }}>
                        {filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(customer.id);
                              setCustomerOpen(false);
                              setCustomerQuery("");
                              setStatus("Unsaved draft");
                            }}
                            style={{
                              textAlign: "left",
                              border: `1px solid ${
                                customer.id === selectedCustomerId ? d11.ink : d11.hairline
                              }`,
                              background:
                                customer.id === selectedCustomerId ? d11.amber : "#fff",
                              padding: 10,
                              cursor: "pointer"
                            }}
                          >
                            <strong style={{ display: "block", fontSize: 13 }}>
                              {customer.name}
                            </strong>
                            <span style={{ fontSize: 12, color: d11.steel }}>
                              {customer.contact}
                            </span>
                          </button>
                        ))}
                        <button type="button" style={smallButton(false)}>
                          <Ico.plus size={14} /> Create a new customer
                        </button>
                      </div>
                    </Card>
                  ) : null}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 10
                  }}
                >
                  <DetailTile label="Quote Date" value={quoteDate} action="Change" />
                  <DetailTile label="Expires" value={expiresDate} action="Change" />
                  <div
                    style={{
                      border: `1px solid ${d11.rail}`,
                      background: d11.bone,
                      padding: 12
                    }}
                  >
                    <Mono style={{ fontSize: 10, color: d11.muted, display: "block" }}>
                      Quote #
                    </Mono>
                    {editingNumber ? (
                      <input
                        value={quoteNumber}
                        onChange={(event) => setQuoteNumber(event.target.value)}
                        onBlur={() => setEditingNumber(false)}
                        autoFocus
                        style={{ ...fieldStyle(), marginTop: 6 }}
                      />
                    ) : (
                      <>
                        <strong style={{ display: "block", marginTop: 6, fontSize: 15 }}>
                          {quoteNumber}
                        </strong>
                        <button
                          type="button"
                          onClick={() => setEditingNumber(true)}
                          style={{ ...smallButton(), marginTop: 10 }}
                        >
                          Edit quote number
                        </button>
                      </>
                    )}
                  </div>
                  <div
                    style={{
                      border: `1px solid ${d11.rail}`,
                      background: d11.bone,
                      padding: 12
                    }}
                  >
                    <Mono style={{ fontSize: 10, color: d11.muted, display: "block" }}>
                      PO / Reference
                    </Mono>
                    <input
                      value={poRef}
                      onChange={(event) => {
                        setPoRef(event.target.value);
                        setStatus("Unsaved draft");
                      }}
                      placeholder="Add PO number or reference"
                      style={{ ...fieldStyle(), marginTop: 6 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                <Btn variant="default" size="sm" onClick={() => setPreviewOpen(true)}>
                  <Ico.receipt size={14} /> Preview
                </Btn>
                <Btn variant="default" size="sm">
                  More quote options <Ico.chevronDown size={14} />
                </Btn>
              </div>
            </Card>

            <Card style={{ padding: 0, overflow: "visible" }}>
              <div
                style={{
                  padding: 14,
                  borderBottom: `1px solid ${d11.hairline}`,
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 8,
                  alignItems: "center"
                }}
              >
                <label
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    alignItems: "center",
                    border: `1px solid ${scanMode ? d11.pine : d11.rail}`,
                    background: "#fff",
                    minWidth: 0
                  }}
                >
                  <span style={{ paddingLeft: 12, color: d11.steel }}>
                    <Ico.search size={17} />
                  </span>
                  <input
                    value={productQuery}
                    onFocus={() => setPickerOpen(true)}
                    onChange={(event) => {
                      setProductQuery(event.target.value);
                      setPickerOpen(true);
                    }}
                    placeholder={
                      scanMode
                        ? "Scan mode ready..."
                        : "Search products by name, SKU, or scan barcode..."
                    }
                    style={{
                      border: "none",
                      height: 44,
                      padding: "0 12px",
                      fontSize: 13,
                      fontWeight: 700,
                      outline: "none",
                      minWidth: 0
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setScanMode((mode) => !mode)}
                  style={smallButton(scanMode)}
                >
                  <Ico.zap size={14} /> Scan
                </button>
                <button type="button" onClick={() => setPickerOpen(true)} style={smallButton()}>
                  <Ico.plus size={14} /> Add product
                </button>
              </div>

              {pickerOpen ? (
                <div style={{ position: "relative" }}>
                  <Card
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 14,
                      right: 14,
                      zIndex: 18,
                      padding: 8,
                      display: "grid",
                      gap: 6,
                      boxShadow: "0 18px 36px rgba(17,17,17,0.14)"
                    }}
                  >
                    {productChoices.length ? (
                      productChoices.map(({ product, variant }) => (
                        <button
                          key={`${product.id}-${variant.id}`}
                          type="button"
                          onClick={() => addProduct(product, variant)}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "52px 1fr auto",
                            gap: 10,
                            alignItems: "center",
                            textAlign: "left",
                            border: `1px solid ${d11.hairline}`,
                            background: "#fff",
                            padding: 8,
                            cursor: "pointer"
                          }}
                        >
                          <img
                            src={variant.image || product.images[0]?.url || "/assets/logo.svg"}
                            alt=""
                            style={{
                              width: 52,
                              height: 52,
                              objectFit: "contain",
                              border: `1px solid ${d11.hairline}`,
                              background: d11.bone
                            }}
                          />
                          <span style={{ minWidth: 0 }}>
                            <strong style={{ display: "block", fontSize: 13 }}>
                              {product.title}
                            </strong>
                            <span style={{ fontSize: 12, color: d11.steel }}>
                              {variantLabel(variant)} - {variant.sku}
                            </span>
                          </span>
                          <Mono style={{ fontSize: 12, color: d11.ink }}>
                            {fmt(variant.price)}
                          </Mono>
                        </button>
                      ))
                    ) : (
                      <div style={{ padding: 12, fontSize: 13, color: d11.steel }}>
                        No matching products.
                      </div>
                    )}
                  </Card>
                </div>
              ) : null}

              <div
                className="d11-line-header"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(280px, 1fr) 110px 100px 100px 118px 118px",
                  gap: 10,
                  padding: "11px 14px",
                  borderBottom: `1px solid ${d11.hairline}`,
                  background: d11.bone
                }}
              >
                {["Product", "Size", "Length", "Thickness", "Qty / Price", "Total"].map(
                  (heading) => (
                    <Mono key={heading} style={{ fontSize: 10, color: d11.muted }}>
                      {heading}
                    </Mono>
                  )
                )}
              </div>

              <div>
                {lines.map((line) => {
                  const lineWay = wayfinding(line.variantId);
                  return (
                    <div
                      key={line.id}
                      className="d11-line-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(280px, 1fr) 110px 100px 100px 118px 118px",
                        gap: 10,
                        alignItems: "center",
                        padding: 14,
                        borderBottom: `1px solid ${d11.hairline}`
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "58px 1fr",
                          gap: 12,
                          minWidth: 0
                        }}
                      >
                        <img
                          src={line.image}
                          alt=""
                          style={{
                            width: 58,
                            height: 58,
                            objectFit: "contain",
                            border: `1px solid ${d11.rail}`,
                            background: d11.bone,
                            padding: 5
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          {line.custom ? (
                            <input
                              value={line.title}
                              onChange={(event) =>
                                updateLine(line.id, { title: event.target.value })
                              }
                              style={{ ...fieldStyle(), height: 34, fontWeight: 800 }}
                            />
                          ) : (
                            <strong style={{ display: "block", fontSize: 14, lineHeight: 1.25 }}>
                              {line.title}
                            </strong>
                          )}
                          <Mono
                            style={{
                              display: "block",
                              marginTop: 5,
                              fontSize: 10,
                              color: d11.muted
                            }}
                          >
                            SKU {line.sku} - Aisle {lineWay.aisle} - Bay {lineWay.bay}
                          </Mono>
                        </div>
                      </div>
                      <input
                        value={line.size}
                        onChange={(event) => updateLine(line.id, { size: event.target.value })}
                        style={{ ...fieldStyle(), height: 36 }}
                      />
                      <input
                        value={line.length}
                        onChange={(event) => updateLine(line.id, { length: event.target.value })}
                        style={{ ...fieldStyle(), height: 36 }}
                      />
                      <input
                        value={line.thickness}
                        onChange={(event) =>
                          updateLine(line.id, { thickness: event.target.value })
                        }
                        style={{ ...fieldStyle(), height: 36 }}
                      />
                      <div style={{ display: "grid", gap: 6 }}>
                        <Qty
                          value={line.qty}
                          height={34}
                          onChange={(next) => updateLine(line.id, { qty: next })}
                        />
                        <input
                          type="number"
                          min={0}
                          value={line.unitPrice}
                          onChange={(event) =>
                            updateLine(line.id, { unitPrice: Number(event.target.value) })
                          }
                          style={{ ...fieldStyle(), height: 34, fontFamily: monoFont }}
                        />
                      </div>
                      <div className="d11-line-money" style={{ display: "grid", gap: 8 }}>
                        <strong
                          style={{
                            fontSize: 18,
                            fontFamily: monoFont,
                            textAlign: "right"
                          }}
                        >
                          {fmt(line.qty * line.unitPrice)}
                        </strong>
                        <button
                          type="button"
                          onClick={() => {
                            setLines((current) => current.filter((item) => item.id !== line.id));
                            setStatus("Unsaved draft");
                          }}
                          style={{ ...smallButton(), justifyContent: "center" }}
                        >
                          <Ico.trash size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setPickerOpen(true)} style={smallButton()}>
                  <Ico.plus size={14} /> Add product
                </button>
                <button type="button" onClick={addCustomItem} style={smallButton()}>
                  <Ico.plus size={14} /> Add custom item
                </button>
              </div>
            </Card>

            <Card style={{ padding: 14 }}>
              <Mono style={{ fontSize: 10, color: d11.muted, display: "block" }}>
                Customer note / terms
              </Mono>
              <textarea
                value={note}
                maxLength={1000}
                onChange={(event) => {
                  setNote(event.target.value);
                  setStatus("Unsaved draft");
                }}
                placeholder="Add a note or terms for this quote..."
                style={{
                  width: "100%",
                  minHeight: 106,
                  resize: "vertical",
                  border: `1px solid ${d11.rail}`,
                  marginTop: 8,
                  padding: 12,
                  fontSize: 13,
                  lineHeight: 1.5,
                  outline: "none"
                }}
              />
              <Mono
                style={{
                  display: "block",
                  textAlign: "right",
                  marginTop: 6,
                  fontSize: 10,
                  color: d11.muted
                }}
              >
                {note.length} / 1000
              </Mono>
            </Card>
          </main>

          <aside style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <Card style={{ padding: 16 }}>
              <Eyebrow style={{ marginBottom: 10 }}>Quote Total</Eyebrow>
              <div style={{ display: "grid", gap: 10 }}>
                <SummaryRow label="Subtotal" value={fmt(subtotal)} />
                <SummaryRow
                  label="Discount"
                  value={`-${fmt(discount)}`}
                  color={discount > 0 ? d11.pine : d11.steel}
                />
                {discountOpen ? (
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(event) => setDiscount(Number(event.target.value))}
                    style={{ ...fieldStyle(), fontFamily: monoFont }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setDiscountOpen(true)}
                    style={{ ...smallButton(), justifyContent: "center" }}
                  >
                    Add discount
                  </button>
                )}
                <SummaryRow label="Delivery estimate" value={fmt(delivery)} />
                {deliveryOpen ? (
                  <input
                    type="number"
                    min={0}
                    value={delivery}
                    onChange={(event) => setDelivery(Number(event.target.value))}
                    style={{ ...fieldStyle(), fontFamily: monoFont }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeliveryOpen(true)}
                    style={{ ...smallButton(), justifyContent: "center" }}
                  >
                    Add delivery estimate
                  </button>
                )}
                <hr
                  style={{
                    height: 1,
                    border: "none",
                    background: d11.rail,
                    margin: "4px 0"
                  }}
                />
                <SummaryRow label="Quote Total" value={fmt(quoteTotal)} bold />
              </div>
            </Card>

            <Card style={{ padding: 16 }}>
              <Eyebrow style={{ marginBottom: 10 }}>Customer Account</Eyebrow>
              <div style={{ display: "grid", gap: 8, fontSize: 12, color: d11.steel }}>
                <strong style={{ color: d11.ink, fontSize: 15 }}>{selectedCustomer.name}</strong>
                <span>{selectedCustomer.contact}</span>
                <span>{selectedCustomer.email}</span>
                <span>{selectedCustomer.phone}</span>
                <span>{selectedCustomer.address}</span>
                <Tag tone="in">{selectedCustomer.terms}</Tag>
              </div>
            </Card>

            <Card style={{ padding: 16, background: d11.ink, color: "#fff" }}>
              <Eyebrow style={{ color: d11.amber, marginBottom: 10 }}>
                Wayfinder Pick Plan
              </Eyebrow>
              <div style={{ display: "grid", gap: 8 }}>
                {lines.slice(0, 4).map((line) => {
                  const lineWay = wayfinding(line.variantId);
                  return (
                    <div
                      key={line.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        borderTop: "1px solid rgba(255,255,255,0.16)",
                        paddingTop: 8,
                        fontSize: 12
                      }}
                    >
                      <span style={{ color: "rgba(255,255,255,0.78)" }}>{line.sku}</span>
                      <Mono style={{ color: d11.amber, fontSize: 10 }}>
                        Aisle {lineWay.aisle} / Bay {lineWay.bay}
                      </Mono>
                    </div>
                  );
                })}
              </div>
            </Card>
          </aside>
        </div>
      </div>

      {previewOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quote preview"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,17,17,0.5)",
            zIndex: 80,
            display: "grid",
            placeItems: "center",
            padding: 24
          }}
        >
          <Card
            style={{
              width: "min(760px, 100%)",
              maxHeight: "88vh",
              overflow: "auto",
              padding: 24
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                borderBottom: `1px solid ${d11.rail}`,
                paddingBottom: 14
              }}
            >
              <div>
                <Eyebrow>Preview</Eyebrow>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>{quoteNumber}</h2>
                <p style={{ margin: "6px 0 0", color: d11.steel, fontSize: 13 }}>
                  {selectedCustomer.name} - expires {expiresDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                style={smallButton()}
              >
                <Ico.x size={14} /> Close
              </button>
            </div>
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {lines.map((line) => (
                <div
                  key={line.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                    borderBottom: `1px solid ${d11.hairline}`,
                    paddingBottom: 10
                  }}
                >
                  <span>
                    <strong style={{ display: "block", fontSize: 14 }}>{line.title}</strong>
                    <span style={{ color: d11.steel, fontSize: 12 }}>
                      {line.qty} x {fmt(line.unitPrice)} - {line.sku}
                    </span>
                  </span>
                  <Mono style={{ fontSize: 13, color: d11.ink }}>
                    {fmt(line.qty * line.unitPrice)}
                  </Mono>
                </div>
              ))}
            </div>
            {note ? (
              <p
                style={{
                  marginTop: 14,
                  padding: 12,
                  background: d11.bone,
                  border: `1px solid ${d11.rail}`,
                  fontSize: 13,
                  color: d11.steel
                }}
              >
                {note}
              </p>
            ) : null}
            <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
              <SummaryRow label="Subtotal" value={fmt(subtotal)} />
              <SummaryRow label="Discount" value={`-${fmt(discount)}`} />
              <SummaryRow label="Delivery estimate" value={fmt(delivery)} />
              <SummaryRow label="Quote Total" value={fmt(quoteTotal)} bold />
            </div>
          </Card>
        </div>
      ) : null}
    </D11Shell>
  );
}
