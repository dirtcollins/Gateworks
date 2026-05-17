import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  ReportsDashboard,
  type ReportData,
  type ReportOrderRow,
  type ReportPaymentBreakdown
} from "@/features/admin/reports/reports-dashboard";

export const metadata = {
  title: "Reports | Gateworks Operations"
};

export const dynamic = "force-dynamic";

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
  quantity: number | string | null;
  unit_price: number | string | null;
  unit_cost: number | string | null;
  line_total: number | string | null;
};

type PaymentRow = {
  order_id: string;
  amount: number | string | null;
};

function emptyData(configured: boolean): ReportData {
  return {
    configured,
    errorMessage: null,
    orderLimit: 500,
    costCoveragePct: 0,
    hasCostData: false,
    revenue30: 0,
    orders30: 0,
    avgOrderValue: 0,
    grossProfit: 0,
    grossMarginPct: 0,
    billed: 0,
    collected: 0,
    outstanding: 0,
    paymentBreakdown: [],
    aging: [],
    recentOrders: []
  };
}

function errorData(message: string): ReportData {
  return {
    ...emptyData(true),
    errorMessage: message
  };
}

export default async function ReportsPage() {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return <ReportsDashboard data={emptyData(false)} />;
  }

  const {
    data: orderData,
    error: orderError
  } = await admin
    .from("orders")
    .select(
      "id, order_number, customer_name, company_name, total, payment_status, status, created_at, is_quote_request"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (orderError) {
    console.error("Reports orders query failed", orderError);
    return <ReportsDashboard data={errorData("Orders could not be loaded for reports.")} />;
  }

  const orders = ((orderData || []) as OrderRow[]).filter(
    (order) => !order.is_quote_request && order.status !== "cancelled"
  );

  if (!orders.length) {
    return <ReportsDashboard data={emptyData(true)} />;
  }

  const orderIds = orders.map((order) => order.id);

  const [
    { data: itemData, error: itemError },
    { data: paymentData, error: paymentError }
  ] = await Promise.all([
    admin
      .from("order_items")
      .select("order_id, quantity, unit_price, unit_cost, line_total")
      .in("order_id", orderIds),
    admin.from("order_payments").select("order_id, amount").in("order_id", orderIds)
  ]);

  if (itemError || paymentError) {
    console.error("Reports detail query failed", { itemError, paymentError });
    return (
      <ReportsDashboard data={errorData("Order line items or payments could not be loaded.")} />
    );
  }

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

  function orderMargin(orderId: string) {
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
  const cutoff30 = now - 30 * 24 * 60 * 60 * 1000;
  const paymentTotals = new Map<string, { count: number; total: number }>();
  const aging = { current: 0, mid: 0, old: 0 };

  let revenue30 = 0;
  let orders30 = 0;
  let billed = 0;
  let collected = 0;
  let outstandingTotal = 0;
  let lineRevenue = 0;
  let cogs = 0;
  let totalLineCount = 0;
  let costedLineCount = 0;

  orders.forEach((order) => {
    const total = Number(order.total || 0);
    const paid = paidByOrder.get(order.id) || 0;
    billed += total;
    collected += paid;

    const outstanding = Math.max(0, total - paid);
    outstandingTotal += outstanding;
    if (outstanding > 0) {
      const ageDays = (now - new Date(order.created_at).getTime()) / (24 * 60 * 60 * 1000);
      if (ageDays <= 30) aging.current += outstanding;
      else if (ageDays <= 60) aging.mid += outstanding;
      else aging.old += outstanding;
    }

    if (new Date(order.created_at).getTime() >= cutoff30) {
      revenue30 += total;
      orders30 += 1;
    }

    const status = order.payment_status || "unpaid";
    const bucket = paymentTotals.get(status) || { count: 0, total: 0 };
    bucket.count += 1;
    bucket.total += total;
    paymentTotals.set(status, bucket);

    (itemsByOrder.get(order.id) || []).forEach((item) => {
      const qty = Number(item.quantity || 0);
      lineRevenue += Number(item.line_total || Number(item.unit_price || 0) * qty);
      totalLineCount += 1;

      const unitCost = Number(item.unit_cost || 0);
      if (unitCost > 0) {
        costedLineCount += 1;
        cogs += unitCost * qty;
      }
    });
  });

  const costCoveragePct = totalLineCount > 0 ? (costedLineCount / totalLineCount) * 100 : 0;
  const hasCostData = totalLineCount > 0 && costedLineCount === totalLineCount;
  const grossProfit = lineRevenue - cogs;

  const data: ReportData = {
    configured: true,
    errorMessage: null,
    orderLimit: 500,
    costCoveragePct,
    hasCostData,
    revenue30,
    orders30,
    avgOrderValue: orders30 > 0 ? revenue30 / orders30 : 0,
    grossProfit,
    grossMarginPct: lineRevenue > 0 ? (grossProfit / lineRevenue) * 100 : 0,
    billed,
    collected,
    outstanding: outstandingTotal,
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

  return <ReportsDashboard data={data} />;
}
