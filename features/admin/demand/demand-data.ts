import type { InventoryRow } from "@/features/admin/inventory/inventory-data";

export type DemandLevel = "low" | "medium" | "high" | "critical";
export type ReorderUrgency = "none" | "watch" | "soon" | "urgent" | "critical";
export type DemandTrend = "increasing" | "declining" | "steady";

export type DemandMetrics = {
  id: string;
  productTitle: string;
  productSlug: string;
  sku: string;
  category: string;
  categorySlug: string;
  supplier: string;
  currentStock: number;
  quantityReserved: number;
  quantityAvailable: number;
  minimumStock: number;
  targetStock: number;
  supplierLeadTimeDays: number;
  totalUnitsSold: number;
  recentUnitsSold: number;
  priorUnitsSold: number;
  salesVelocityWeekly: number;
  priorVelocityWeekly: number;
  trendPercent: number;
  trend: DemandTrend;
  quoteAdds: number;
  orderAdds: number;
  searches: number;
  pageViews: number;
  abandonedCarts: number;
  restockRequests: number;
  seasonalityMultiplier: number;
  isSeasonal: boolean;
  demandScore: number;
  demandLevel: DemandLevel;
  weeksOfSupply: number | null;
  expectedStockoutDate: string | null;
  recommendedReorderQuantity: number;
  reorderUrgency: ReorderUrgency;
  purchasingNote: string;
};

export type DemandSummary = {
  highDemand: number;
  criticalDemand: number;
  reorderNow: number;
  stockoutRisk: number;
  highInterestLowInventory: number;
  averageDemandScore: number;
};

const reportDate = new Date("2026-05-14T12:00:00.000Z");

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function getLeadTime(row: InventoryRow) {
  if (row.categorySlug.includes("motor")) return 21;
  if (row.categorySlug.includes("milwaukee")) return 10;
  if (row.categorySlug.includes("hinge") || row.categorySlug.includes("latch")) return 7;
  if (row.categorySlug.includes("metal") || row.categorySlug.includes("tubing")) return 14;
  return 9;
}

function getSeasonality(row: InventoryRow, index: number) {
  const exteriorHardware =
    row.categorySlug.includes("gate") ||
    row.categorySlug.includes("fence") ||
    row.categorySlug.includes("hinge") ||
    row.categorySlug.includes("latch");
  const summerBuildSeason = reportDate.getMonth() >= 3 && reportDate.getMonth() <= 7;

  if (exteriorHardware && summerBuildSeason) return 1.18;
  if (index % 11 === 0) return 1.1;
  return 1;
}

function getBaseDemand(row: InventoryRow, index: number) {
  const categoryBoost = row.categorySlug.includes("latch")
    ? 12
    : row.categorySlug.includes("hinge")
      ? 10
      : row.categorySlug.includes("milwaukee")
        ? 8
        : row.categorySlug.includes("motor")
          ? 5
          : 6;

  const priceDrag = row.unitPrice > 250 ? -2 : row.unitPrice < 25 ? 4 : 0;
  return Math.max(1, categoryBoost + priceDrag + (index % 9));
}

function getDemandLevel(score: number): DemandLevel {
  if (score >= 80) return "critical";
  if (score >= 62) return "high";
  if (score >= 38) return "medium";
  return "low";
}

function getTrend(recentVelocity: number, priorVelocity: number): {
  trend: DemandTrend;
  trendPercent: number;
} {
  if (priorVelocity === 0 && recentVelocity > 0) {
    return { trend: "increasing", trendPercent: 100 };
  }

  const trendPercent = priorVelocity
    ? ((recentVelocity - priorVelocity) / priorVelocity) * 100
    : 0;

  if (trendPercent > 15) return { trend: "increasing", trendPercent };
  if (trendPercent < -15) return { trend: "declining", trendPercent };
  return { trend: "steady", trendPercent };
}

function getStockoutDate(weeksOfSupply: number | null) {
  if (weeksOfSupply === null || !Number.isFinite(weeksOfSupply)) return null;
  const date = new Date(reportDate);
  date.setDate(date.getDate() + Math.ceil(weeksOfSupply * 7));
  return date.toISOString().slice(0, 10);
}

function getReorderUrgency(
  quantityAvailable: number,
  minimumStock: number,
  weeksOfSupply: number | null,
  supplierLeadTimeDays: number,
  demandLevel: DemandLevel
): ReorderUrgency {
  const leadTimeWeeks = supplierLeadTimeDays / 7;

  if (quantityAvailable <= 0) return "critical";
  if (quantityAvailable <= minimumStock && demandLevel === "critical") return "critical";
  if (weeksOfSupply !== null && weeksOfSupply <= leadTimeWeeks) return "urgent";
  if (quantityAvailable <= minimumStock) return "urgent";
  if (weeksOfSupply !== null && weeksOfSupply <= leadTimeWeeks + 1) return "soon";
  if (demandLevel === "high" || demandLevel === "critical") return "watch";
  return "none";
}

function getDemandScore(input: {
  totalUnitsSold: number;
  salesVelocityWeekly: number;
  trendPercent: number;
  quoteAdds: number;
  orderAdds: number;
  searches: number;
  pageViews: number;
  abandonedCarts: number;
  restockRequests: number;
  quantityAvailable: number;
  minimumStock: number;
  supplierLeadTimeDays: number;
  seasonalityMultiplier: number;
}) {
  const soldScore = clamp(input.totalUnitsSold / 2.5, 0, 18);
  const velocityScore = clamp(input.salesVelocityWeekly * 2.2, 0, 18);
  const trendScore = clamp((input.trendPercent + 40) / 4, 0, 15);
  const quoteOrderScore = clamp(input.quoteAdds * 1.2 + input.orderAdds * 2, 0, 14);
  const interestScore = clamp(
    input.searches * 0.4 + input.pageViews * 0.12 + input.abandonedCarts * 1.1 + input.restockRequests * 4,
    0,
    16
  );
  const inventoryPressureScore =
    input.quantityAvailable <= 0
      ? 12
      : clamp(((input.minimumStock * 2 - input.quantityAvailable) / Math.max(input.minimumStock * 2, 1)) * 12, 0, 12);
  const leadTimeScore = clamp(input.supplierLeadTimeDays / 2.5, 0, 5);
  const seasonalityScore = clamp((input.seasonalityMultiplier - 1) * 10, 0, 2);

  return Math.round(
    clamp(
      soldScore +
        velocityScore +
        trendScore +
        quoteOrderScore +
        interestScore +
        inventoryPressureScore +
        leadTimeScore +
        seasonalityScore,
      0,
      100
    )
  );
}

export function buildDemandMetrics(rows: InventoryRow[]): DemandMetrics[] {
  return rows.map((row, index) => {
    const baseDemand = getBaseDemand(row, index);
    const seasonalityMultiplier = getSeasonality(row, index);
    const recentUnitsSold = Math.round(baseDemand * seasonalityMultiplier);
    const priorUnitsSold = Math.max(0, Math.round(baseDemand * (0.75 + (index % 5) * 0.12)));
    const totalUnitsSold = recentUnitsSold + priorUnitsSold + baseDemand * 4;
    const salesVelocityWeekly = recentUnitsSold / 4;
    const priorVelocityWeekly = priorUnitsSold / 4;
    const { trend, trendPercent } = getTrend(salesVelocityWeekly, priorVelocityWeekly);
    const quoteAdds = Math.round(baseDemand * 0.4 + (index % 4));
    const orderAdds = Math.round(recentUnitsSold * 0.55);
    const searches = Math.round(baseDemand * 1.8 + (index % 7));
    const pageViews = Math.round(baseDemand * 5 + row.unitPrice / 20);
    const abandonedCarts = Math.round(baseDemand * 0.25 + (index % 3));
    const restockRequests = row.quantityAvailable <= row.reorderPoint ? 1 + (index % 4) : index % 13 === 0 ? 1 : 0;
    const supplierLeadTimeDays = getLeadTime(row);
    const minimumStock = row.reorderPoint || Math.max(2, Math.ceil(salesVelocityWeekly));
    const targetStock = Math.ceil(Math.max(minimumStock * 2, salesVelocityWeekly * 6));
    const weeksOfSupply =
      salesVelocityWeekly > 0 ? round(row.quantityAvailable / salesVelocityWeekly, 1) : null;
    const expectedStockoutDate = getStockoutDate(weeksOfSupply);
    const leadTimeDemand = Math.ceil(salesVelocityWeekly * (supplierLeadTimeDays / 7));
    const recommendedReorderQuantity = Math.max(
      0,
      Math.ceil(targetStock + leadTimeDemand - row.quantityAvailable)
    );
    const demandScore = getDemandScore({
      totalUnitsSold,
      salesVelocityWeekly,
      trendPercent,
      quoteAdds,
      orderAdds,
      searches,
      pageViews,
      abandonedCarts,
      restockRequests,
      quantityAvailable: row.quantityAvailable,
      minimumStock,
      supplierLeadTimeDays,
      seasonalityMultiplier
    });
    const demandLevel = getDemandLevel(demandScore);
    const reorderUrgency = getReorderUrgency(
      row.quantityAvailable,
      minimumStock,
      weeksOfSupply,
      supplierLeadTimeDays,
      demandLevel
    );

    return {
      id: row.id,
      productTitle: row.productTitle,
      productSlug: row.productSlug,
      sku: row.sku,
      category: row.category,
      categorySlug: row.categorySlug,
      supplier: row.supplier,
      currentStock: row.quantityOnHand,
      quantityReserved: row.quantityReserved,
      quantityAvailable: row.quantityAvailable,
      minimumStock,
      targetStock,
      supplierLeadTimeDays,
      totalUnitsSold,
      recentUnitsSold,
      priorUnitsSold,
      salesVelocityWeekly: round(salesVelocityWeekly, 1),
      priorVelocityWeekly: round(priorVelocityWeekly, 1),
      trendPercent: round(trendPercent, 1),
      trend,
      quoteAdds,
      orderAdds,
      searches,
      pageViews,
      abandonedCarts,
      restockRequests,
      seasonalityMultiplier,
      isSeasonal: seasonalityMultiplier > 1,
      demandScore,
      demandLevel,
      weeksOfSupply,
      expectedStockoutDate,
      recommendedReorderQuantity,
      reorderUrgency,
      purchasingNote:
        reorderUrgency === "critical"
          ? "Order immediately or approve substitution."
          : reorderUrgency === "urgent"
            ? "Add to next supplier purchase order."
            : demandLevel === "high"
              ? "Monitor weekly and confirm supplier availability."
              : "No immediate purchasing action."
    };
  });
}

export function getDemandSummary(metrics: DemandMetrics[]): DemandSummary {
  const totalScore = metrics.reduce((sum, item) => sum + item.demandScore, 0);

  return {
    highDemand: metrics.filter((item) => item.demandLevel === "high").length,
    criticalDemand: metrics.filter((item) => item.demandLevel === "critical").length,
    reorderNow: metrics.filter((item) => ["urgent", "critical"].includes(item.reorderUrgency)).length,
    stockoutRisk: metrics.filter((item) => item.weeksOfSupply !== null && item.weeksOfSupply <= item.supplierLeadTimeDays / 7).length,
    highInterestLowInventory: metrics.filter(
      (item) =>
        item.searches + item.pageViews + item.quoteAdds + item.abandonedCarts > 70 &&
        item.quantityAvailable <= item.minimumStock
    ).length,
    averageDemandScore: metrics.length ? Math.round(totalScore / metrics.length) : 0
  };
}
