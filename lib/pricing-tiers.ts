export type PriceTierRule = {
  tier: string;
  categorySlug: string | null;
  discountPct: number;
  minQuantity: number;
};

type LineInput = {
  tier: string;
  categorySlug?: string | null;
  quantity: number;
};

// Best discount for a line: the highest discount_pct among rules that match
// the company's tier, the line quantity, and either the line's category or a
// category-agnostic rule (category_slug = null).
export function resolveLineDiscountPct(rules: PriceTierRule[], line: LineInput): number {
  return rules
    .filter(
      (rule) =>
        rule.tier === line.tier &&
        line.quantity >= rule.minQuantity &&
        (rule.categorySlug === null || rule.categorySlug === line.categorySlug)
    )
    .reduce((best, rule) => Math.max(best, rule.discountPct), 0);
}

export function applyTierDiscount(unitPrice: number, discountPct: number): number {
  if (discountPct <= 0) {
    return unitPrice;
  }

  const discounted = unitPrice * (1 - discountPct / 100);
  return Number(Math.max(0, discounted).toFixed(2));
}
