import { getSupabaseAdminClient } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// Report types — owned here, with the data layer that produces them.
// ---------------------------------------------------------------------------
export type ReportPaymentBreakdown = {
  status: string;
  count: number;
  total: number;
};

export type ReportOrderRow = {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  total: number;
  paymentStatus: string;
  margin: number | null;
};

export type RevenuePoint = {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
};

export type TopCustomer = {
  name: string;
  orders: number;
  revenue: number;
};

export type TopProduct = {
  sku: string;
  title: string;
  units: number;
  revenue: number;
};

export type ReportAgingBucket = { bucket: string; total: number };

export type ReportData = {
  configured: boolean;
  hasCostData: boolean;
  // Trailing-30-day window and the prior 30 days for deltas.
  revenue30: number;
  orders30: number;
  revenuePrev30: number;
  ordersPrev30: number;
  avgOrderValue: number;
  avgOrderValuePrev: number;
  grossProfit: number;
  grossMarginPct: number;
  // Accounts receivable.
  billed: number;
  collected: number;
  outstanding: number;
  collectionRatePct: number;
  // Series + breakdowns.
  daily: RevenuePoint[]; // last 90 calendar days, continuous
  statusCounts: Record<string, number>; // fulfillment status -> order count
  topCustomers: TopCustomer[];
  topProducts: TopProduct[];
  paymentBreakdown: ReportPaymentBreakdown[];
  aging: ReportAgingBucket[];
  recentOrders: ReportOrderRow[];
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  company_name: string | null;
  total: number | string | null;
  payment_status: string | null;
  status: string | null;
  created_at: string;
  is_quote_request: boolean | null;
};

type OrderItemRow = {
  order_id: string;
  sku: string | null;
  description: string | null;
  quantity: number | string | null;
  unit_price: number | string | null;
  unit_cost: number | string | null;
  line_total: number | string | null;
};

type PaymentRow = {
  order_id: string;
  amount: number | string | null;
};

const DAY = 24 * 60 * 60 * 1000;
const SERIES_DAYS = 90;

function emptyReportData(configured: boolean): ReportData {
  return {
    configured,
    hasCostData: false,
    revenue30: 0,
    orders30: 0,
    revenuePrev30: 0,
    ordersPrev30: 0,
    avgOrderValue: 0,
    avgOrderValuePrev: 0,
    grossProfit: 0,
    grossMarginPct: 0,
    billed: 0,
    collected: 0,
    outstanding: 0,
    collectionRatePct: 0,
    daily: buildEmptySeries(),
    statusCounts: {},
    topCustomers: [],
    topProducts: [],
    paymentBreakdown: [],
    aging: [],
    recentOrders: []
  };
}

function dayKey(value: string | number | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

// A continuous 90-day skeleton so charts have no gaps even on quiet days.
function buildEmptySeries(): RevenuePoint[] {
  const today = Date.now();
  const points: RevenuePoint[] = [];
  for (let i = SERIES_DAYS - 1; i >= 0; i -= 1) {
    points.push({ date: dayKey(today - i * DAY), revenue: 0, orders: 0 });
  }
  return points;
}

// Aggregates revenue trend, AOV, payment status, AR aging, gross margin, top
// customers, and top products from Supabase orders. Server-only.
export async function fetchReportData(): Promise<ReportData> {
  const admin = getSupabaseAdminClient();
  if (!admin) return emptyReportData(false);

  const { data: orderData } = await admin
    .from("orders")
    .select(
      "id, order_number, customer_name, company_name, total, payment_status, status, created_at, is_quote_request"
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  const orders = ((orderData || []) as OrderRow[]).filter(
    (order) => !order.is_quote_request && order.status !== "cancelled"
  );

  if (!orders.length) return emptyReportData(true);

  const orderIds = orders.map((order) => order.id);

  const [{ data: itemData }, { data: paymentData }] = await Promise.all([
    admin
      .from("order_items")
      .select("order_id, sku, description, quantity, unit_price, unit_cost, line_total")
      .in("order_id", orderIds),
    admin.from("order_payments").select("order_id, amount").in("order_id", orderIds)
  ]);

  const items = (itemData || []) as OrderItemRow[];
  const payments = (paymentData || []) as PaymentRow[];

  const itemsByOrder = new Map<string, OrderItemRow[]>();
  items.forEach((item) => {
    const list = itemsByOrder.get(item.order_id) || [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  });

  const paidByOrder = new Map<string, number>();
  payments.forEach((payment) => {
    paidByOrder.set(
      payment.order_id,
      (paidByOrder.get(payment.order_id) || 0) + Number(payment.amount || 0)
    );
  });

  function orderMargin(orderId: string): number | null {
    const orderItems = itemsByOrder.get(orderId);
    if (!orderItems || !orderItems.length) return null;
    let hasCost = false;
    let margin = 0;
    orderItems.forEach((item) => {
      const qty = Number(item.quantity || 0);
      const lineTotal = Number(item.line_total || Number(item.unit_price || 0) * qty);
      const cost = Number(item.unit_cost || 0) * qty;
      if (cost > 0) hasCost = true;
      margin += lineTotal - cost;
    });
    return hasCost ? margin : null;
  }

  const now = Date.now();
  const cutoff30 = now - 30 * DAY;
  const cutoff60 = now - 60 * DAY;
  const seriesCutoff = now - SERIES_DAYS * DAY;

  const paymentTotals = new Map<string, { count: number; total: number }>();
  const aging = { current: 0, mid: 0, old: 0 };
  const seriesMap = new Map<string, { revenue: number; orders: number }>();
  const statusCounts: Record<string, number> = {};
  const customerMap = new Map<string, { orders: number; revenue: number }>();

  let revenue30 = 0;
  let orders30 = 0;
  let revenuePrev30 = 0;
  let ordersPrev30 = 0;
  let billed = 0;
  let collected = 0;
  let lineRevenue = 0;
  let cogs = 0;

  orders.forEach((order) => {
    const total = Number(order.total || 0);
    const paid = paidByOrder.get(order.id) || 0;
    const placed = new Date(order.created_at).getTime();
    billed += total;
    collected += paid;

    const outstanding = Math.max(0, total - paid);
    if (outstanding > 0) {
      const ageDays = (now - placed) / DAY;
      if (ageDays <= 30) aging.current += outstanding;
      else if (ageDays <= 60) aging.mid += outstanding;
      else aging.old += outstanding;
    }

    if (placed >= cutoff30) {
      revenue30 += total;
      orders30 += 1;
    } else if (placed >= cutoff60) {
      revenuePrev30 += total;
      ordersPrev30 += 1;
    }

    if (placed >= seriesCutoff) {
      const key = dayKey(placed);
      const point = seriesMap.get(key) || { revenue: 0, orders: 0 };
      point.revenue += total;
      point.orders += 1;
      seriesMap.set(key, point);
    }

    const fulfillment = order.status || "unknown";
    statusCounts[fulfillment] = (statusCounts[fulfillment] || 0) + 1;

    const status = order.payment_status || "unpaid";
    const bucket = paymentTotals.get(status) || { count: 0, total: 0 };
    bucket.count += 1;
    bucket.total += total;
    paymentTotals.set(status, bucket);

    const customerName =
      order.company_name || order.customer_name || "Unknown customer";
    const customer = customerMap.get(customerName) || { orders: 0, revenue: 0 };
    customer.orders += 1;
    customer.revenue += total;
    customerMap.set(customerName, customer);

    (itemsByOrder.get(order.id) || []).forEach((item) => {
      const qty = Number(item.quantity || 0);
      lineRevenue += Number(item.line_total || Number(item.unit_price || 0) * qty);
      cogs += Number(item.unit_cost || 0) * qty;
    });
  });

  // Top products by revenue across all orders in range.
  const productMap = new Map<string, { title: string; units: number; revenue: number }>();
  items.forEach((item) => {
    const sku = (item.sku || "").trim();
    if (!sku) return;
    const qty = Number(item.quantity || 0);
    const revenue = Number(item.line_total || Number(item.unit_price || 0) * qty);
    const entry = productMap.get(sku) || {
      title: item.description || sku,
      units: 0,
      revenue: 0
    };
    entry.units += qty;
    entry.revenue += revenue;
    if (!entry.title && item.description) entry.title = item.description;
    productMap.set(sku, entry);
  });

  const daily = buildEmptySeries().map((point) => {
    const found = seriesMap.get(point.date);
    return found ? { date: point.date, ...found } : point;
  });

  const hasCostData = cogs > 0;
  const grossProfit = lineRevenue - cogs;

  return {
    configured: true,
    hasCostData,
    revenue30,
    orders30,
    revenuePrev30,
    ordersPrev30,
    avgOrderValue: orders30 > 0 ? revenue30 / orders30 : 0,
    avgOrderValuePrev: ordersPrev30 > 0 ? revenuePrev30 / ordersPrev30 : 0,
    grossProfit,
    grossMarginPct: lineRevenue > 0 ? (grossProfit / lineRevenue) * 100 : 0,
    billed,
    collected,
    outstanding: Math.max(0, billed - collected),
    collectionRatePct: billed > 0 ? (collected / billed) * 100 : 0,
    daily,
    statusCounts,
    topCustomers: Array.from(customerMap.entries())
      .map(([name, value]): TopCustomer => ({ name, ...value }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
    topProducts: Array.from(productMap.entries())
      .map(([sku, value]): TopProduct => ({ sku, ...value }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
    paymentBreakdown: Array.from(paymentTotals.entries())
      .map(
        ([status, value]): ReportPaymentBreakdown => ({
          status,
          count: value.count,
          total: value.total
        })
      )
      .sort((a, b) => b.total - a.total),
    aging: [
      { bucket: "0-30", total: aging.current },
      { bucket: "31-60", total: aging.mid },
      { bucket: "60+", total: aging.old }
    ],
    recentOrders: orders.slice(0, 25).map(
      (order): ReportOrderRow => ({
        id: order.id,
        orderNumber: order.order_number,
        createdAt: order.created_at,
        customerName: order.company_name || order.customer_name || "Unknown customer",
        total: Number(order.total || 0),
        paymentStatus: order.payment_status || "unpaid",
        margin: orderMargin(order.id)
      })
    )
  };
}
