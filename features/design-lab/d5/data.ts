/**
 * DESIGN 5 — inline sample data. No APIs, no stores. Realistic supply-yard catalog.
 */

export type Product = {
  sku: string;
  name: string;
  category: string;
  spec: string;
  price: number;
  uom: string;
  stock: number;
  hub: string;
  lead: string;
  swatch: string;
  tier?: number;
};

export const PRODUCTS: Product[] = [
  {
    sku: "STL-SQT-2014",
    name: 'Square Tube 2" × 14ga',
    category: "Steel Tube",
    spec: 'A500 · 2.000" OD · 0.083" wall · 24 ft',
    price: 38.4,
    uom: "stick",
    stock: 412,
    hub: "DEN-01",
    lead: "ships today",
    swatch: "#6b7180",
    tier: 3
  },
  {
    sku: "STL-RBR-0058",
    name: 'Round Bar 5/8" Cold Roll',
    category: "Bar Stock",
    spec: '1018 CR · 0.625" dia · 20 ft',
    price: 21.95,
    uom: "stick",
    stock: 980,
    hub: "DEN-01",
    lead: "ships today",
    swatch: "#7a808d"
  },
  {
    sku: "GAT-HNG-BRL4",
    name: "Weld-On Barrel Hinge 4in",
    category: "Gate Hardware",
    spec: "Greasable · 1/2in pin · zinc · pair",
    price: 14.5,
    uom: "pair",
    stock: 264,
    hub: "DEN-01",
    lead: "ships today",
    swatch: "#5ee6a8"
  },
  {
    sku: "GAT-LCH-DLX",
    name: "Deluxe Locking Gate Latch",
    category: "Gate Hardware",
    spec: "Lockable · black powdercoat · weld-on",
    price: 32.0,
    uom: "ea",
    stock: 88,
    hub: "COS-02",
    lead: "1–2 days",
    swatch: "#3f4450"
  },
  {
    sku: "STL-PLT-3163",
    name: 'Steel Plate 3/16" Hot Roll',
    category: "Plate & Sheet",
    spec: 'A36 · 0.1875" · 48in × 96in sheet',
    price: 184.2,
    uom: "sheet",
    stock: 36,
    hub: "DEN-01",
    lead: "ships today",
    swatch: "#6b7180",
    tier: 2
  },
  {
    sku: "FNC-PKT-6FT",
    name: "Ornamental Picket 6ft",
    category: "Fence Panel",
    spec: "Pressed-spear top · powdercoat black",
    price: 47.75,
    uom: "ea",
    stock: 510,
    hub: "DEN-01",
    lead: "ships today",
    swatch: "#2b2f38"
  },
  {
    sku: "STL-ANG-2018",
    name: 'Angle Iron 2" × 2" × 1/8"',
    category: "Bar Stock",
    spec: "A36 · equal leg · 20 ft",
    price: 29.6,
    uom: "stick",
    stock: 0,
    hub: "COS-02",
    lead: "backorder 8d",
    swatch: "#7a808d"
  },
  {
    sku: "WLD-ER70-035",
    name: "ER70S-6 MIG Wire .035",
    category: "Welding",
    spec: "33 lb spool · copper-coated",
    price: 96.0,
    uom: "spool",
    stock: 142,
    hub: "DEN-01",
    lead: "ships today",
    swatch: "#c98b3a"
  },
  {
    sku: "GAT-WHL-SWV",
    name: "Swivel Caster Gate Wheel",
    category: "Gate Hardware",
    spec: "8in poly · 500 lb · weld plate",
    price: 41.25,
    uom: "ea",
    stock: 73,
    hub: "DEN-01",
    lead: "ships today",
    swatch: "#5ee6a8"
  },
  {
    sku: "STL-FLT-1414",
    name: 'Flat Bar 1/4" × 1-1/2"',
    category: "Bar Stock",
    spec: "A36 · hot roll · 20 ft",
    price: 18.4,
    uom: "stick",
    stock: 620,
    hub: "DEN-01",
    lead: "ships today",
    swatch: "#7a808d"
  },
  {
    sku: "FNC-CHN-9G",
    name: "Chain Link Fabric 9ga",
    category: "Fence Panel",
    spec: "6ft × 50ft roll · galvanized",
    price: 132.0,
    uom: "roll",
    stock: 54,
    hub: "COS-02",
    lead: "1–2 days",
    swatch: "#8b919c"
  },
  {
    sku: "WLD-CAP-04",
    name: '2" Square Tube End Cap',
    category: "Gate Hardware",
    spec: "Black plastic · snap-in · bag/25",
    price: 8.9,
    uom: "bag",
    stock: 340,
    hub: "DEN-01",
    lead: "ships today",
    swatch: "#3f4450"
  }
];

export const CATEGORIES = [
  { name: "Steel Tube", count: 64, swatch: "#6b7180" },
  { name: "Bar Stock", count: 121, swatch: "#7a808d" },
  { name: "Plate & Sheet", count: 38, swatch: "#6b7180" },
  { name: "Gate Hardware", count: 207, swatch: "#5ee6a8" },
  { name: "Fence Panel", count: 49, swatch: "#2b2f38" },
  { name: "Welding", count: 88, swatch: "#c98b3a" }
];

export type Order = {
  id: string;
  customer: string;
  hub: string;
  items: number;
  total: number;
  status: "new" | "picking" | "ready" | "shipped" | "hold";
  channel: "web" | "counter" | "phone";
  age: string;
  rep: string;
};

export const ORDERS: Order[] = [
  { id: "GW-48201", customer: "Front Range Welding", hub: "DEN-01", items: 14, total: 1842.5, status: "new", channel: "web", age: "4m", rep: "M.Tate" },
  { id: "GW-48200", customer: "Summit Fence Co.", hub: "DEN-01", items: 9, total: 967.0, status: "picking", channel: "phone", age: "22m", rep: "R.Diaz" },
  { id: "GW-48199", customer: "Hoover Hardware", hub: "COS-02", items: 31, total: 4310.8, status: "picking", channel: "counter", age: "38m", rep: "M.Tate" },
  { id: "GW-48198", customer: "Mesa Gate & Iron", hub: "DEN-01", items: 6, total: 512.4, status: "ready", channel: "web", age: "1h 10m", rep: "K.Olsen" },
  { id: "GW-48197", customer: "Cole Brothers Steel", hub: "COS-02", items: 22, total: 2980.0, status: "hold", channel: "web", age: "1h 45m", rep: "R.Diaz" },
  { id: "GW-48196", customer: "Aspen Custom Rail", hub: "DEN-01", items: 11, total: 1376.2, status: "shipped", channel: "phone", age: "3h", rep: "K.Olsen" },
  { id: "GW-48195", customer: "Front Range Welding", hub: "DEN-01", items: 4, total: 288.6, status: "shipped", channel: "counter", age: "4h", rep: "M.Tate" },
  { id: "GW-48194", customer: "Ridgeline Fabrication", hub: "COS-02", items: 18, total: 2104.9, status: "ready", channel: "web", age: "5h", rep: "R.Diaz" }
];

export type CartLine = {
  sku: string;
  name: string;
  spec: string;
  price: number;
  uom: string;
  qty: number;
  swatch: string;
  lead: string;
};

export const CART_SEED: CartLine[] = [
  { sku: "STL-SQT-2014", name: 'Square Tube 2" × 14ga', spec: 'A500 · 24 ft', price: 38.4, uom: "stick", qty: 40, swatch: "#6b7180", lead: "ships today" },
  { sku: "GAT-HNG-BRL4", name: "Weld-On Barrel Hinge 4in", spec: "Greasable · pair", price: 14.5, uom: "pair", qty: 12, swatch: "#5ee6a8", lead: "ships today" },
  { sku: "GAT-LCH-DLX", name: "Deluxe Locking Gate Latch", spec: "Lockable · weld-on", price: 32.0, uom: "ea", qty: 6, swatch: "#3f4450", lead: "1–2 days" },
  { sku: "WLD-ER70-035", name: "ER70S-6 MIG Wire .035", spec: "33 lb spool", price: 96.0, uom: "spool", qty: 4, swatch: "#c98b3a", lead: "ships today" }
];

export const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
