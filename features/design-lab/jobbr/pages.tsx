"use client";

import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  FileText,
  Grid2X2,
  Home,
  Inbox,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  Wrench
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  featuredProduct,
  getCategoryProducts,
  newArrivals,
  popularProducts,
  topCategories
} from "@/features/design-lab/live-data";
import type { Product } from "@/lib/types";

const ui = {
  ink: "#032b3a",
  text: "#233d48",
  muted: "#49646f",
  rail: "#eeece7",
  paper: "#f9f8f6",
  border: "#dadfe2",
  green: "#388523",
  greenDark: "#2e6e1f",
  blue: "#225c8c"
};

const nav: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Home", href: "/design-lab/jobbr/home", icon: Home },
  { label: "Schedule", href: "/design-lab/jobbr/orders", icon: CalendarDays },
  { label: "Clients", href: "/design-lab/jobbr/category", icon: Users },
  { label: "Requests", href: "/design-lab/jobbr/product", icon: Inbox },
  { label: "Quotes", href: "/design-lab/jobbr/cart", icon: ClipboardList },
  { label: "Jobs", href: "/design-lab/jobbr/orders", icon: Wrench },
  { label: "Invoices", href: "/design-lab/jobbr/cart", icon: FileText },
  { label: "Reports", href: "/design-lab/jobbr/reports", icon: BarChart3 }
];

const featured = (popularProducts.length ? popularProducts : newArrivals).slice(0, 5);
const categoryProducts = getCategoryProducts(featuredProduct.category.slug).slice(0, 8);

function money(value: number) {
  return value.toLocaleString("en-US", { currency: "USD", style: "currency" });
}

function Button({
  children,
  href,
  variant = "primary"
}: {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "border-transparent text-white"
      : "border-[#dadfe2] bg-white text-[#388523]";
  const style =
    variant === "primary"
      ? { background: ui.green, borderColor: ui.greenDark }
      : undefined;
  const content = (
    <span
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-bold transition hover:opacity-90 ${className}`}
      style={style}
    >
      {children}
    </span>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border bg-white ${className}`} style={{ borderColor: ui.border }}>
      {children}
    </section>
  );
}

function Stat({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="px-4 py-4">
      <p className="text-xs font-semibold" style={{ color: ui.muted }}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-[-0.02em]" style={{ color: ui.ink }}>
        {value}
      </p>
      <p className="mt-1 text-xs" style={{ color: ui.muted }}>
        {helper}
      </p>
    </Card>
  );
}

function ProductThumb({ product, compact = false }: { product: Product; compact?: boolean }) {
  const image = product.images[0]?.url ?? product.variants[0]?.image;
  return (
    <div
      className={`overflow-hidden rounded-md border bg-[#f3f1ec] ${compact ? "h-14 w-14" : "h-36 w-full"}`}
      style={{ borderColor: ui.border }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={product.title} className="h-full w-full object-contain p-3" src={image} />
      ) : (
        <div className="grid h-full w-full place-items-center text-sm font-black" style={{ color: ui.muted }}>
          GW
        </div>
      )}
    </div>
  );
}

function Row({ title, body, meta }: { title: string; body: string; meta?: ReactNode }) {
  return (
    <div className="grid gap-2 border-t px-4 py-4 md:grid-cols-[1fr_auto]" style={{ borderColor: ui.border }}>
      <div>
        <p className="font-black" style={{ color: ui.ink }}>
          {title}
        </p>
        <p className="mt-1 text-sm" style={{ color: ui.muted }}>
          {body}
        </p>
      </div>
      {meta ? <div className="text-sm font-black" style={{ color: ui.ink }}>{meta}</div> : null}
    </div>
  );
}

function Sidebar({ current }: { current: string }) {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 hidden w-[236px] border-r lg:block"
      style={{ background: ui.rail, borderColor: ui.border }}
    >
      <div className="flex h-16 items-center gap-3 px-5">
        <span className="grid size-8 place-items-center rounded-md border bg-white" style={{ borderColor: ui.border, color: ui.ink }}>
          <Grid2X2 className="size-5" />
        </span>
        <div>
          <p className="text-sm font-black" style={{ color: ui.ink }}>Gateworks</p>
          <p className="text-xs" style={{ color: ui.muted }}>Jobbr concept</p>
        </div>
      </div>
      <nav className="space-y-1 px-3 py-2">
        <Link className="mb-3 flex items-center gap-3 rounded-md px-3 py-3 text-sm font-black" href="/design-lab/jobbr/cart" style={{ color: ui.ink }}>
          <Plus className="size-5" /> Create
        </Link>
        {nav.map((item, index) => {
          const Icon = item.icon;
          const active = item.label === current;
          return (
            <Link
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-black ${index === 3 || index === 7 ? "mt-3 border-t pt-4" : ""}`}
              href={item.href}
              key={item.label}
              style={{ background: active ? "#fff" : "transparent", borderColor: ui.border, color: active ? ui.ink : ui.text }}
            >
              <Icon className="size-5" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute inset-x-3 bottom-14 rounded-lg border bg-white p-4" style={{ borderColor: ui.border }}>
        <p className="text-sm font-black" style={{ color: ui.ink }}>Counter setup</p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: ui.muted }}>5 steps left to finish the contractor portal.</p>
        <div className="mt-3 h-2 rounded-full bg-[#dadfe2]">
          <div className="h-2 w-2/5 rounded-full" style={{ background: ui.green }} />
        </div>
      </div>
    </aside>
  );
}

function Shell({ children, current, title, actions }: { children: ReactNode; current: string; title: string; actions?: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: ui.paper, color: ui.text }}>
      <Sidebar current={current} />
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur lg:ml-[236px]" style={{ borderColor: ui.border }}>
        <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="grid size-9 place-items-center rounded-md border lg:hidden" style={{ borderColor: ui.border }} type="button">
              <Menu className="size-5" />
            </button>
            <span className="text-sm" style={{ color: ui.muted }}>The Gate Shop</span>
            <span className="hidden text-sm font-black sm:inline" style={{ color: ui.ink }}>/ {title}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden h-10 items-center gap-2 rounded-md px-3 md:flex" style={{ background: ui.rail }}>
              <Search className="size-4" style={{ color: ui.ink }} />
              <span className="text-sm" style={{ color: ui.muted }}>Search</span>
              <kbd className="rounded border bg-white px-1.5 text-xs" style={{ borderColor: ui.border }}>/</kbd>
            </div>
            {[Sparkles, Bell, Settings].map((Icon, index) => (
              <button className="grid size-10 place-items-center rounded-md" key={index} type="button">
                <Icon className="size-5" style={{ color: ui.ink }} />
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="lg:ml-[236px]">
        <div className="mx-auto max-w-[1500px] px-4 py-8 lg:px-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: ui.blue }}>Jobbr</p>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.035em]" style={{ color: ui.ink }}>{title}</h1>
            </div>
            {actions}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function JobbrHome() {
  return (
    <Shell actions={<Button href="/design-lab/jobbr/category"><Plus className="size-4" /> New order</Button>} current="Home" title="Today">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat helper="6 staged for pickup" label="Open orders" value="28" />
        <Stat helper="$12.4k awaiting approval" label="Quote pipeline" value="$42.8k" />
        <Stat helper="3 items below reorder point" label="Inventory alerts" value="17" />
        <Stat helper="Average counter time" label="Fulfillment" value="18m" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h2 className="text-xl font-black" style={{ color: ui.ink }}>Work queue</h2>
              <p className="text-sm" style={{ color: ui.muted }}>Same-day pickup, delivery, and quote work.</p>
            </div>
            <Button href="/design-lab/jobbr/orders" variant="secondary">View all</Button>
          </div>
          {[
            ["Pick ticket #1842", "Valley Fence Supply · 11 line items · Will-call bay 2", "Due 10:30"],
            ["Quote follow-up", "Bakersfield Ironworks · cantilever gate package", "$8,420"],
            ["Delivery route", "3 stops · west side contractor loop", "Ready"],
            ["Receiving check", "Hinges and latch boxes from supplier dock", "2 pallets"]
          ].map(([title, body, meta]) => <Row body={body} key={title} meta={meta} title={title} />)}
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black" style={{ color: ui.ink }}>Featured counter item</h2>
              <p className="mt-1 text-sm" style={{ color: ui.muted }}>Fast access to high-turn hardware.</p>
            </div>
            <Package className="size-6" style={{ color: ui.green }} />
          </div>
          <div className="mt-5"><ProductThumb product={featuredProduct} /></div>
          <p className="mt-4 text-lg font-black" style={{ color: ui.ink }}>{featuredProduct.title}</p>
          <p className="mt-1 text-sm" style={{ color: ui.muted }}>{featuredProduct.category.name} · {featuredProduct.variants.length} variants</p>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-2xl font-black" style={{ color: ui.ink }}>{money(featuredProduct.price)}</span>
            <Button href="/design-lab/jobbr/product">Open</Button>
          </div>
        </Card>
      </div>
    </Shell>
  );
}

export function JobbrCategory() {
  return (
    <Shell actions={<Button href="/design-lab/jobbr/product"><Plus className="size-4" /> Add product</Button>} current="Clients" title="Catalog">
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <Card className="p-4">
          <p className="font-black" style={{ color: ui.ink }}>Filters</p>
          {topCategories.slice(0, 7).map((category) => (
            <Link className="mt-3 flex items-center justify-between rounded-md px-3 py-2 text-sm font-bold hover:bg-[#f9f8f6]" href="/design-lab/jobbr/category" key={category.slug} style={{ color: ui.text }}>
              {category.name}
              <span className="rounded-full bg-[#eef2f3] px-2 py-0.5 text-xs" style={{ color: ui.muted }}>{getCategoryProducts(category.slug).length}</span>
            </Link>
          ))}
        </Card>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <h2 className="text-xl font-black" style={{ color: ui.ink }}>{featuredProduct.category.name}</h2>
              <p className="text-sm" style={{ color: ui.muted }}>Contractor-ready pricing, variants, and stock status.</p>
            </div>
            <div className="flex h-10 items-center gap-2 rounded-md border bg-white px-3" style={{ borderColor: ui.border }}>
              <Search className="size-4" style={{ color: ui.muted }} />
              <span className="text-sm" style={{ color: ui.muted }}>Search products</span>
            </div>
          </div>
          <div className="grid gap-px border-t bg-[#dadfe2] sm:grid-cols-2 xl:grid-cols-4" style={{ borderColor: ui.border }}>
            {categoryProducts.map((product) => (
              <Link className="bg-white p-4 hover:bg-[#f9f8f6]" href="/design-lab/jobbr/product" key={product.id}>
                <ProductThumb product={product} />
                <p className="mt-3 min-h-12 text-sm font-black leading-snug" style={{ color: ui.ink }}>{product.title}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="font-black" style={{ color: ui.ink }}>{money(product.price)}</span>
                  <span style={{ color: ui.green }}>{product.variants.length} variants</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </Shell>
  );
}

export function JobbrProduct() {
  return (
    <Shell actions={<Button href="/design-lab/jobbr/cart"><ShoppingCart className="size-4" /> Add to quote</Button>} current="Requests" title="Product">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <ProductThumb product={featuredProduct} />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {featured.slice(0, 3).map((product) => <ProductThumb compact key={product.id} product={product} />)}
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <p className="text-sm font-black" style={{ color: ui.blue }}>{featuredProduct.category.name}</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em]" style={{ color: ui.ink }}>{featuredProduct.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: ui.muted }}>{featuredProduct.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat helper="Contractor tier" label="Price" value={money(featuredProduct.price)} />
              <Stat helper="Across finishes" label="Variants" value={`${featuredProduct.variants.length}`} />
              <Stat helper="Pickup today" label="Availability" value="In stock" />
            </div>
          </Card>
          <Card>
            <div className="px-5 py-4"><h3 className="text-xl font-black" style={{ color: ui.ink }}>Configure line item</h3></div>
            {[["Finish", "Black powder coat"], ["Length", "Standard"], ["Quantity", "1"]].map(([label, value]) => (
              <div className="flex items-center justify-between border-t px-5 py-4" key={label} style={{ borderColor: ui.border }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: ui.muted }}>{label}</p>
                  <p className="font-black" style={{ color: ui.ink }}>{value}</p>
                </div>
                <Plus className="size-4" style={{ color: ui.green }} />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </Shell>
  );
}

export function JobbrCart() {
  const lines = [featuredProduct, ...featured.slice(0, 2)];
  return (
    <Shell actions={<Button><FileText className="size-4" /> Save quote</Button>} current="Invoices" title="New Quote">
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card className="border-t-4 border-t-[#225c8c] p-5">
            <h2 className="text-xl font-black" style={{ color: ui.ink }}>Contractor</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border p-4" style={{ borderColor: ui.border }}>
                <p className="font-black" style={{ color: ui.ink }}>Valley Fence Supply</p>
                <p className="mt-3 text-sm leading-6" style={{ color: ui.muted }}>11933 Forsyth Court<br />Bakersfield, CA 93311<br />661-444-2857</p>
              </div>
              <div className="space-y-3">
                {["Quote #", "Issued date", "Payment terms"].map((label, index) => (
                  <div className="grid grid-cols-[130px_1fr] items-center gap-3" key={label}>
                    <span className="text-sm" style={{ color: ui.muted }}>{label}</span>
                    <span className="rounded-md border bg-white px-3 py-2 text-sm font-bold" style={{ borderColor: ui.border, color: ui.ink }}>{index === 0 ? "1042" : index === 1 ? "Today" : "Net 30"}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card>
            <div className="px-5 py-4"><h2 className="text-xl font-black" style={{ color: ui.ink }}>Product / Service</h2></div>
            {lines.map((product, index) => (
              <div className="grid gap-3 border-t px-5 py-4 md:grid-cols-[1fr_90px_120px_120px]" key={`${product.id}-${index}`} style={{ borderColor: ui.border }}>
                <div>
                  <p className="text-xs" style={{ color: ui.muted }}>Name</p>
                  <p className="font-black" style={{ color: ui.ink }}>{product.title}</p>
                  <p className="mt-1 text-sm" style={{ color: ui.muted }}>{index === 0 ? "Primary gate hardware package" : "Add-on component"}</p>
                </div>
                <div><p className="text-xs" style={{ color: ui.muted }}>Qty</p><p className="font-black" style={{ color: ui.ink }}>{index + 1}</p></div>
                <div><p className="text-xs" style={{ color: ui.muted }}>Unit price</p><p className="font-black" style={{ color: ui.ink }}>{money(product.price)}</p></div>
                <div><p className="text-xs" style={{ color: ui.muted }}>Total</p><p className="font-black" style={{ color: ui.ink }}>{money(product.price * (index + 1))}</p></div>
              </div>
            ))}
            <div className="border-t px-5 py-4" style={{ borderColor: ui.border }}><Button variant="secondary"><Plus className="size-4" /> Add line item</Button></div>
          </Card>
        </div>
        <Card className="self-start">
          <div className="px-5 py-4"><h2 className="text-xl font-black" style={{ color: ui.ink }}>Quote totals</h2></div>
          {[["Subtotal", "$1,248.00"], ["Discount", "Add Discount"], ["Tax", "Add Tax"], ["Total", "$1,248.00"], ["Quote balance", "$1,248.00"]].map(([label, value], index) => (
            <div className="flex items-center justify-between border-t px-5 py-4" key={label} style={{ borderColor: ui.border }}>
              <span className={index === 3 ? "text-lg font-black" : "text-sm"} style={{ color: index === 3 ? ui.ink : ui.text }}>{label}</span>
              <span className="font-black" style={{ color: value.startsWith("Add") ? ui.green : ui.ink }}>{value}</span>
            </div>
          ))}
          <div className="border-t p-5" style={{ borderColor: ui.border }}><Button><FileText className="size-4" /> Save quote</Button></div>
        </Card>
      </div>
    </Shell>
  );
}

export function JobbrOrders() {
  return (
    <Shell actions={<Button><Plus className="size-4" /> New job</Button>} current="Jobs" title="Jobs">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat helper="Needs pick ticket" label="Today" value="14" />
        <Stat helper="Scheduled this week" label="Upcoming" value="38" />
        <Stat helper="Waiting on stock" label="On hold" value="5" />
        <Stat helper="This month" label="Completed" value="126" />
      </div>
      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <h2 className="text-xl font-black" style={{ color: ui.ink }}>Job board</h2>
          <div className="flex gap-2">
            {["All", "Today", "Waiting", "Complete"].map((tab) => (
              <span className="rounded-md border px-3 py-2 text-sm font-bold" key={tab} style={{ borderColor: ui.border, background: tab === "All" ? ui.rail : "white", color: ui.ink }}>{tab}</span>
            ))}
          </div>
        </div>
        {[
          ["1842", "Valley Fence Supply", "Will-call pickup", "$2,640", "Ready"],
          ["1843", "Bakersfield Ironworks", "Quote conversion", "$8,420", "Draft"],
          ["1844", "North County Welding", "Delivery route", "$1,950", "Scheduled"],
          ["1845", "Sierra Gate Co.", "Backorder release", "$3,115", "Waiting"]
        ].map(([id, client, type, amount, status]) => (
          <div className="grid gap-3 border-t px-5 py-4 md:grid-cols-[90px_1fr_1fr_120px_120px]" key={id} style={{ borderColor: ui.border }}>
            <span className="font-black" style={{ color: ui.ink }}>#{id}</span>
            <span className="font-black" style={{ color: ui.ink }}>{client}</span>
            <span style={{ color: ui.muted }}>{type}</span>
            <span className="font-black" style={{ color: ui.ink }}>{amount}</span>
            <span className="rounded-full bg-[#eef2f3] px-3 py-1 text-center text-xs font-black" style={{ color: status === "Ready" ? ui.green : ui.muted }}>{status}</span>
          </div>
        ))}
      </Card>
    </Shell>
  );
}

export function JobbrReports() {
  const groups = [
    { title: "Financial reports", rows: [["Projected income", "Projected income from quotes and invoices awaiting payment"], ["Transaction list", "All payments, deposits, invoices, and refunds"], ["Invoices", "Invoice report with contractor account data"], ["Aged receivables", "Open customer balances grouped by age"]] },
    { title: "Work reports", rows: [["Visits", "Delivery and pickup appointments with field notes"], ["One-off jobs", "Counter jobs with additional client and stock data"], ["Quotes", "Quote report with conversion and salesperson data"], ["Products & Services", "Usage of products on quotes, jobs, and invoices"]] },
    { title: "Client reports", rows: [["Clients", "All contractors and companies in the account"], ["Lead source", "Revenue by customer source"], ["Client communications", "Messages sent through the portal"], ["Property list", "Jobsites, yards, and delivery addresses"]] }
  ];
  return (
    <Shell current="Reports" title="Reports">
      <div className="grid gap-6 xl:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.title}>
            <div className="px-5 py-4"><h2 className="text-xl font-black" style={{ color: ui.ink }}>{group.title}</h2></div>
            {group.rows.map(([title, body]) => <Row body={body} key={title} title={title} />)}
          </Card>
        ))}
      </div>
      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black" style={{ color: ui.ink }}>Expense reports</h2>
            <p className="mt-1 text-sm" style={{ color: ui.muted }}>Tracked purchase orders, receiving variance, delivery costs, and margin by job.</p>
          </div>
          <Button variant="secondary">Open report</Button>
        </div>
      </Card>
    </Shell>
  );
}
