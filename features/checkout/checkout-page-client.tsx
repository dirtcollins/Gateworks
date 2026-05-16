"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, FileUp, MapPin, PackageCheck, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useCartStore } from "@/lib/cart-store";
import { useOrderStore, type CustomerDrawing, type OrderAddress } from "@/lib/order-store";
import { useUserStore } from "@/lib/user-store";
import { formatCurrency } from "@/lib/utils";
import type { FulfillmentMethod } from "@/lib/platform-backend";

const pickupWindows = [
  "7:00 AM - 9:00 AM",
  "9:00 AM - 11:00 AM",
  "11:00 AM - 1:00 PM",
  "1:00 PM - 3:00 PM",
  "3:00 PM - 5:00 PM"
];

const emptyAddress: OrderAddress = {
  name: "",
  company: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  notes: ""
};

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function CheckoutPageClient() {
  const { items, clearCart } = useCartStore();
  const createOrder = useOrderStore((state) => state.createOrder);
  const displayName = useUserStore((state) => state.displayName);
  const userId = useUserStore((state) => state.userId);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("pickup");
  const [requestedDate, setRequestedDate] = useState(tomorrowDate());
  const [requestedWindow, setRequestedWindow] = useState(pickupWindows[1]);
  const [jobName, setJobName] = useState("");
  const [isQuoteRequest, setIsQuoteRequest] = useState(false);
  const [drawingFiles, setDrawingFiles] = useState<File[]>([]);
  const [address, setAddress] = useState<OrderAddress>({
    ...emptyAddress,
    name: displayName === "Guest" ? "" : displayName
  });
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );
  const shippingWeightLbs = useMemo(
    () =>
      items.reduce(
        (total, item) => total + (item.weightLbs || 0) * item.quantity,
        0
      ),
    [items]
  );
  const deliveryFee = fulfillmentMethod === "delivery" ? (subtotal >= 500 ? 0 : 85) : 0;
  const tax = isQuoteRequest ? 0 : Number((subtotal * 0.0825).toFixed(2));
  const total = subtotal + tax + deliveryFee;

  function updateAddress(field: keyof OrderAddress, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  function addDrawingFiles(files: FileList | null) {
    if (!files?.length) return;
    setDrawingFiles((currentFiles) => {
      const filesByKey = new Map(
        currentFiles.map((file) => [`${file.name}-${file.size}-${file.lastModified}`, file])
      );

      for (const file of Array.from(files)) {
        filesByKey.set(`${file.name}-${file.size}-${file.lastModified}`, file);
      }

      return Array.from(filesByKey.values()).slice(0, 6);
    });
  }

  function removeDrawingFile(fileToRemove: File) {
    setDrawingFiles((currentFiles) =>
      currentFiles.filter(
        (file) =>
          `${file.name}-${file.size}-${file.lastModified}` !==
          `${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`
      )
    );
  }

  async function submitOrder() {
    if (isSubmitting) return;

    if (!items.length) {
      setError("Add products to the cart before checkout.");
      return;
    }

    if (!address.name || !address.email || !address.phone) {
      setError("Customer name, email, and phone are required.");
      return;
    }

    if (fulfillmentMethod === "delivery" && (!address.addressLine1 || !address.city || !address.state || !address.postalCode)) {
      setError("Delivery orders require a complete jobsite address.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const drawings: CustomerDrawing[] = drawingFiles.map((file) => ({
        id: `drawing-${file.name}-${file.lastModified}`.replace(/[^a-zA-Z0-9-_]+/g, "-"),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        uploadedAt: new Date().toISOString()
      }));

      const order = createOrder({
        userId,
        customerName: address.name,
        companyName: address.company,
        email: address.email,
        phone: address.phone,
        items,
        fulfillmentMethod,
        requestedDate,
        requestedWindow,
        jobName,
        jobsiteAddress: address,
        drawings,
        pickupContact: address.name,
        subtotal,
        tax,
        deliveryFee,
        total,
        status: isQuoteRequest ? "draft" : "submitted",
        paymentStatus: isQuoteRequest ? "unpaid" : "unpaid",
        isQuoteRequest
      });

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
      }).catch(() => null);

      if (!orderResponse) {
        setError("Could not reach /api/orders. Please check that the local server is running.");
        return;
      }

      const orderPayload = (await orderResponse?.json().catch(() => null)) as
        | { persisted?: boolean; reason?: string; orderNumber?: string }
        | null;
      const submittedOrderNumber = orderPayload?.orderNumber || order.orderNumber;

      if (!orderResponse?.ok || !orderPayload?.persisted) {
        const fallbackReason = `Order API responded with ${orderResponse.status} ${orderResponse.statusText}.`;
        setError(orderPayload?.reason || "Order could not be saved to Supabase.");
        if (!orderPayload?.reason && orderResponse.status >= 500) {
          setError(`${fallbackReason} Please try again or check the server logs.`);
        }
        return;
      }

      if (drawingFiles.length) {
        const formData = new FormData();
        formData.set("orderNumber", submittedOrderNumber);
        formData.set("userId", userId);
        formData.set("customerName", address.name);
        for (const file of drawingFiles) {
          formData.append("drawings", file);
        }

        const drawingResponse = await fetch("/api/customer-drawings", {
          method: "POST",
          body: formData
        }).catch(() => null);

        if (!drawingResponse) {
          setError("Could not reach /api/customer-drawings. Please try again.");
          return;
        }

        const drawingPayload = (await drawingResponse?.json().catch(() => null)) as
          | { persisted?: boolean; reason?: string }
          | null;

        if (!drawingResponse?.ok || !drawingPayload?.persisted) {
          const fallbackReason = `Drawings API responded with ${drawingResponse.status} ${drawingResponse.statusText}.`;
          setError(
            drawingPayload?.reason ||
              `Order saved, but drawings could not be uploaded to Supabase. ${fallbackReason}`
          );
          return;
        }
      }

      setSubmittedOrderNumber(submittedOrderNumber);
      clearCart();
      setDrawingFiles([]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit order. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedOrderNumber) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardBody className="grid gap-4 p-8 text-center">
            <CheckCircle2 className="mx-auto text-industrial-pine" size={44} />
            <h1 className="text-3xl font-black text-industrial-ink">
              {isQuoteRequest ? "Quote request submitted" : "Order submitted"}
            </h1>
            <p className="text-sm leading-6 text-industrial-steel">
              Reference {submittedOrderNumber}. Staff can now review it in the Orders admin module.
            </p>
            <div className="flex justify-center gap-2">
              <Link href="/admin/orders">
                <Button variant="primary">View admin orders</Button>
              </Link>
              <Link href="/">
                <Button>Continue shopping</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 border-b border-jobsite-rail pb-5">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-jobsite-pine">
          Contractor checkout
        </p>
        <h1 className="text-3xl font-bold text-jobsite-ink md:text-4xl">
          Schedule pickup or delivery
        </h1>
      </div>

      {!items.length ? (
        <Card>
          <CardBody className="p-8 text-center">
            <p className="text-lg font-semibold text-industrial-ink">Your cart is empty.</p>
            <Link href="/" className="mt-5 inline-flex">
              <Button variant="primary">Browse products</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="grid gap-5">
            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Fulfillment
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">
                    Pickup or delivery scheduling
                  </h2>
                </div>
              </CardHeader>
              <CardBody className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["pickup", "delivery"] as FulfillmentMethod[]).map((method) => (
                    <button
                      className={`grid gap-2 border p-4 text-left transition ${
                        fulfillmentMethod === method
                          ? "border-industrial-ink bg-industrial-paper"
                          : "border-industrial-rail bg-white hover:border-industrial-ink"
                      }`}
                      key={method}
                      onClick={() => setFulfillmentMethod(method)}
                      type="button"
                    >
                      {method === "pickup" ? <PackageCheck size={20} /> : <Truck size={20} />}
                      <span className="font-black capitalize text-industrial-ink">{method}</span>
                      <span className="text-sm leading-6 text-industrial-steel">
                        {method === "pickup"
                          ? "Reserve stock and stage material for counter or yard pickup."
                          : "Schedule a jobsite delivery with route-ready address details."}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-industrial-ink">Requested date</span>
                    <Input
                      min={tomorrowDate()}
                      onChange={(event) => setRequestedDate(event.target.value)}
                      type="date"
                      value={requestedDate}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-industrial-ink">Time window</span>
                    <Select
                      onChange={(event) => setRequestedWindow(event.target.value)}
                      value={requestedWindow}
                    >
                      {pickupWindows.map((window) => (
                        <option key={window} value={window}>
                          {window}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Customer
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">
                    Account and jobsite details
                  </h2>
                </div>
              </CardHeader>
              <CardBody className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Contact name" value={address.name} onChange={(event) => updateAddress("name", event.target.value)} />
                  <Input placeholder="Company" value={address.company} onChange={(event) => updateAddress("company", event.target.value)} />
                  <Input placeholder="Email" type="email" value={address.email} onChange={(event) => updateAddress("email", event.target.value)} />
                  <Input placeholder="Phone" value={address.phone} onChange={(event) => updateAddress("phone", event.target.value)} />
                </div>
                <Input placeholder="Job name or PO number" value={jobName} onChange={(event) => setJobName(event.target.value)} />
                {fulfillmentMethod === "delivery" && (
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm font-black text-industrial-ink">
                      <MapPin size={16} />
                      Jobsite delivery address
                    </div>
                    <Input placeholder="Address line 1" value={address.addressLine1} onChange={(event) => updateAddress("addressLine1", event.target.value)} />
                    <Input placeholder="Address line 2" value={address.addressLine2} onChange={(event) => updateAddress("addressLine2", event.target.value)} />
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input placeholder="City" value={address.city} onChange={(event) => updateAddress("city", event.target.value)} />
                      <Input placeholder="State" value={address.state} onChange={(event) => updateAddress("state", event.target.value)} />
                      <Input placeholder="ZIP" value={address.postalCode} onChange={(event) => updateAddress("postalCode", event.target.value)} />
                    </div>
                  </div>
                )}
                <Textarea placeholder="Gate code, forklift needs, cut instructions, shop notes" value={address.notes} onChange={(event) => updateAddress("notes", event.target.value)} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Drawings
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">
                    Customer drawing uploads
                  </h2>
                </div>
                <FileUp size={20} />
              </CardHeader>
              <CardBody className="grid gap-4">
                <label className="grid cursor-pointer place-items-center border border-dashed border-industrial-rail bg-white p-6 text-center hover:border-industrial-ink">
                  <FileUp className="text-industrial-muted" size={26} />
                  <span className="mt-3 text-sm font-black text-industrial-ink">
                    Upload drawings, field sketches, cut lists, or reference photos
                  </span>
                  <span className="mt-1 text-xs font-semibold text-industrial-muted">
                    PDF, image, CAD, and document files. Up to 6 files per checkout.
                  </span>
                  <input
                    className="sr-only"
                    multiple
                    onChange={(event) => {
                      addDrawingFiles(event.target.files);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>
                {drawingFiles.length ? (
                  <div className="grid gap-2">
                    {drawingFiles.map((file) => (
                      <div
                        className="grid grid-cols-[1fr_auto] items-center gap-3 border border-industrial-rail p-3"
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-industrial-ink">{file.name}</p>
                          <p className="text-xs font-semibold text-industrial-muted">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          aria-label={`Remove ${file.name}`}
                          className="grid size-9 place-items-center border border-industrial-rail text-industrial-muted hover:border-red-700 hover:text-red-700"
                          onClick={() => removeDrawingFile(file)}
                          type="button"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardBody>
            </Card>
          </section>

          <aside className="h-fit">
            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Review
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">Order summary</h2>
                </div>
                <CalendarDays size={20} />
              </CardHeader>
              <CardBody className="grid gap-4">
                <div className="grid gap-3">
                  {items.map((item) => (
                    <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-industrial-rail pb-3 text-sm" key={item.variantId}>
                      <div>
                        <p className="font-black text-industrial-ink">{item.title}</p>
                        <p className="text-xs font-semibold text-industrial-muted">
                          {item.quantity} x {item.sku}
                        </p>
                      </div>
                      <p className="font-black">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <label className="flex items-start gap-3 border border-industrial-rail p-3 text-sm">
                  <input
                    checked={isQuoteRequest}
                    className="mt-1"
                    onChange={(event) => setIsQuoteRequest(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    <strong className="block text-industrial-ink">Submit as quote request</strong>
                    Staff will price, verify availability, and convert to invoice later.
                  </span>
                </label>
                <div className="grid gap-2 border-t border-industrial-rail pt-4 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
                  {shippingWeightLbs > 0 && (
                    <div className="flex justify-between"><span>Material weight</span><strong>{shippingWeightLbs.toFixed(2)} lb</strong></div>
                  )}
                  <div className="flex justify-between"><span>Delivery</span><strong>{formatCurrency(deliveryFee)}</strong></div>
                  <div className="flex justify-between"><span>Estimated tax</span><strong>{formatCurrency(tax)}</strong></div>
                  <div className="flex justify-between text-xl"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
                </div>
                {error && <p className="border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>}
                <Button disabled={isSubmitting} onClick={submitOrder} variant="primary">
                  {isSubmitting
                    ? "Submitting..."
                    : isQuoteRequest
                    ? "Submit quote request"
                    : "Submit order"}
                </Button>
                <Link href="/cart">
                  <Button className="w-full">Back to cart</Button>
                </Link>
              </CardBody>
            </Card>
          </aside>
        </div>
      )}
    </main>
  );
}
