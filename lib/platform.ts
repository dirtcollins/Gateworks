import { platformModules } from "@/lib/platform-modules";

export const platformNav = [
  { href: "/", label: "Catalog" },
  { href: "/account", label: "Account" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/demand", label: "Demand" },
  { href: "/quotes", label: "Quotes" },
  { href: "/admin", label: "Operations" }
];

export const adminModules = platformModules;

export const productFamilies = [
  "Sheet metal",
  "Square tubing",
  "Round tubing",
  "Rectangle tubing",
  "Angle iron",
  "Flat bar",
  "Ornamental iron",
  "Gate hardware",
  "Hinges",
  "Latches",
  "Cane bolts",
  "Gate motors",
  "Fence materials",
  "Welding supplies",
  "Fasteners",
  "Paint & primer",
  "Concrete & anchors"
];
