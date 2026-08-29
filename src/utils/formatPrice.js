/** Menu prices are stored in thousands of toman. Display as a full amount. */
export function formatPrice(amountInThousands) {
  if (amountInThousands === null || amountInThousands === undefined || amountInThousands === "") {
    return "";
  }
  const n = Number(amountInThousands);
  if (Number.isNaN(n)) return "";
  return `${Number(n * 1000).toLocaleString("fa-IR")} تومان`;
}
