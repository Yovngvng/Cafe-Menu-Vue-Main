/** Prices are stored in thousands of toman. Tax applies above this subtotal. */
export const TAX_THRESHOLD = 200;
export const TAX_RATE = 0.1;

export function lineSubtotal(items) {
  return (items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
}

export function orderTotals(items) {
  const subtotal = lineSubtotal(items);
  const tax = subtotal > TAX_THRESHOLD ? Math.round(subtotal * TAX_RATE) : 0;
  return {
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
