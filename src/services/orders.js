import { supabase, friendlyError, isPermissionError } from "./supabase.js";
import { canonicalStatus, STATUS } from "../utils/orderStatus.js";
import { HOLDER_FEE } from "../utils/orderTotals.js";

function compactItems(items, tax = 0, holderRequested = false, holderFee = 0) {
  const lines = (items || [])
    .filter((item) => item && item.name)
    .map((item) => ({
      name: item.name,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      ...(item.size ? { size: item.size } : {}),
      ...(item.topping ? { topping: item.topping } : {}),
      ...(item.productName ? { productName: item.productName } : {}),
    }));

  if (Number(tax) > 0) {
    lines.push({ tax: Number(tax) });
  }

  if (holderRequested) {
    lines.push({
      holder_requested: true,
      holder_fee: Number(holderFee) || HOLDER_FEE,
    });
  }

  return lines;
}

export function normalizeOrder(row) {
  if (!row) return row;
  return {
    ...row,
    status: canonicalStatus(row.status),
    items: Array.isArray(row.items) ? row.items : [],
    total: Number(row.total) || 0,
    order_type: row.order_type || "",
    table_number: row.table_number || "",
    customer_name: row.customer_name || "",
    note: row.note || "",
  };
}

export async function createOrder({
  orderType,
  tableNumber,
  note,
  items,
  total,
  tax = 0,
  holderRequested = false,
  holderFee = 0,
}) {
  const payload = {
    customer_name: null,
    order_type: orderType,
    table_number: tableNumber || null,
    note: note || null,
    items: compactItems(items, tax, holderRequested, holderFee),
    total,
    status: STATUS.WAITING,
  };

  const { data, error } = await supabase.from("orders").insert([payload]).select("id").maybeSingle();

  if (error) {
    console.error(error);
    return { ok: false, error, message: friendlyError(error, "خطا تو ثبت سفارش, دوباره امتحان کن") };
  }

  return { ok: true, data };
}

export async function getOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, order_type, table_number, note, status, total, items, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return { ok: false, error, orders: [], message: friendlyError(error, "نتونستم سفارش‌ها رو بخونم") };
  }

  return { ok: true, orders: (data || []).map(normalizeOrder) };
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(error);
    return { ok: false, error, message: friendlyError(error, "وضعیت به‌روز نشد") };
  }

  return { ok: true, data };
}

export async function deleteOrder(id) {
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { ok: false, error, message: friendlyError(error, "حذف سفارش انجام نشد") };
  }

  return { ok: true };
}

export { isPermissionError };
