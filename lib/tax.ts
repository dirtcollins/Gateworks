// Single source of truth for sales tax. Override the default rate with the
// NEXT_PUBLIC_TAX_RATE environment variable (e.g. 0.0725 for 7.25%).
export const DEFAULT_TAX_RATE = (() => {
  const parsed = Number(process.env.NEXT_PUBLIC_TAX_RATE);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0.0825;
})();

type TaxOptions = {
  taxExempt?: boolean;
  rate?: number;
};

export function calculateTax(taxableAmount: number, options: TaxOptions = {}) {
  if (options.taxExempt) {
    return 0;
  }

  const rate = options.rate ?? DEFAULT_TAX_RATE;
  return Number((taxableAmount * rate).toFixed(2));
}
