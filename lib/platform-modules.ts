import {
  Boxes,
  BrainCircuit,
  ClipboardList,
  FileText,
  Forklift,
  LayoutDashboard,
  MapPinned,
  PackageCheck,
  ReceiptText,
  Truck,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PlatformModuleId =
  | "catalog"
  | "orders"
  | "inventory"
  | "demand"
  | "quotes"
  | "invoices"
  | "customers"
  | "suppliers"
  | "purchasing"
  | "warehouse"
  | "deliveries"
  | "reports";

export type PlatformModule = {
  id: PlatformModuleId;
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export const platformModules: PlatformModule[] = [
  {
    id: "catalog",
    label: "Catalog",
    href: "/admin/catalog",
    description: "Products, categories, photos, SKUs, dimensions, material specs, pricing, and availability.",
    icon: PackageCheck
  },
  {
    id: "orders",
    label: "Orders",
    href: "/admin/orders",
    description: "Customer orders, checkout status, pickup and delivery scheduling.",
    icon: ClipboardList
  },
  {
    id: "inventory",
    label: "Inventory",
    href: "/admin/inventory",
    description: "SKU stock, reservations, bins, receiving, adjustments, and audit logs.",
    icon: Boxes
  },
  {
    id: "demand",
    label: "Demand",
    href: "/admin/demand",
    description: "Demand scores, sales velocity, stockout risk, and reorder recommendations.",
    icon: BrainCircuit
  },
  {
    id: "quotes",
    label: "Quotes",
    href: "/admin/quotes",
    description: "Quote requests, approvals, contractor pricing, and conversion workflow.",
    icon: FileText
  },
  {
    id: "invoices",
    label: "Invoices",
    href: "/admin/invoices",
    description: "Invoices, tax, delivery fees, payments, partial payments, and refunds.",
    icon: ReceiptText
  },
  {
    id: "customers",
    label: "Customers",
    href: "/admin/customers",
    description: "Retail customers, contractor companies, users, addresses, and terms.",
    icon: Users
  },
  {
    id: "suppliers",
    label: "Suppliers",
    href: "/admin/suppliers",
    description: "Supplier profiles, costs, lead times, and vendor invoice history.",
    icon: PackageCheck
  },
  {
    id: "purchasing",
    label: "Purchasing",
    href: "/admin/purchase-orders",
    description: "Purchase orders, backorders, expected receipts, and landed costs.",
    icon: Truck
  },
  {
    id: "warehouse",
    label: "Warehouse",
    href: "/admin/warehouse",
    description: "Pick tickets, mobile picking, staging, receiving, and cycle counts.",
    icon: Forklift
  },
  {
    id: "deliveries",
    label: "Deliveries",
    href: "/admin/deliveries",
    description: "Driver queue, routes, proof photos, signatures, and completion status.",
    icon: MapPinned
  },
  {
    id: "reports",
    label: "Reports",
    href: "/admin/reports",
    description: "Sales, inventory turns, gross margin, purchasing, and staff activity.",
    icon: LayoutDashboard
  }
];
