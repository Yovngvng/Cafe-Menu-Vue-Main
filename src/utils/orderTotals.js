/** Prices are stored in thousands of toman. Tax applies above this subtotal. */
export const TAX_THRESHOLD = 300;
export const TAX_RATE = 0.1;
export const HOLDER_FEE = 15;

export function lineSubtotal(items) {
  return (items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
}

export function orderTotals(items, { holderFee = 0 } = {}) {
  const itemsSubtotal = lineSubtotal(items);
  const extra = Number(holderFee) || 0;
  const subtotal = itemsSubtotal + extra;
  const tax = subtotal > TAX_THRESHOLD ? Math.round(subtotal * TAX_RATE) : 0;
  return {
    itemsSubtotal,
    holderFee: extra,
    subtotal,
    tax,
    total: subtotal + tax,
  };
}

export function extractOrderTax(items) {
  if (!Array.isArray(items)) return 0;
  const meta = items.find((item) => item && typeof item.tax === "number" && !item.name);
  return Number(meta?.tax) || 0;
}

export function productLines(items) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item && item.name);
}

export function extractHolderRequested(items) {
  if (!Array.isArray(items)) return false;
  return items.some((item) => item && item.holder_requested === true && !item.name);
}

export function extractHolderFee(items) {
  if (!Array.isArray(items)) return 0;
  const meta = items.find((item) => item && !item.name && (item.holder_fee != null || item.holder_requested));
  if (!meta) return 0;
  if (meta.holder_requested && meta.holder_fee == null) return HOLDER_FEE;
  return Number(meta.holder_fee) || 0;
}
