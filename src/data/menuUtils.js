import { formatPrice } from "../utils/formatPrice.js";
import { priceKey } from "./catalog.js";

const SIZE_LABELS = ["یک نفره", "دو نفره", "چهار نفره", "تک نفره"];
const SIZE_PATTERN = SIZE_LABELS.join("|");

export function itemListPrice(item) {
  if (item?.sizes?.length) {
    return Math.min(...item.sizes.map((size) => Number(size.price)));
  }
  return Number(item?.price) || 0;
}

export function formatItemListPrice(item) {
  const formatted = formatPrice(itemListPrice(item));
  if (item?.sizes?.length) return `از ${formatted}`;
  return formatted;
}

export function cartLineName(baseName, sizeLabel, toppingName) {
  let name = baseName;
  if (sizeLabel) name = `${baseName} - ${sizeLabel}`;
  if (toppingName) name = `${name} + ${toppingName}`;
  return name;
}

export function buildCartLine(item, { size, toppingSelected } = {}) {
  const chosenSize = size || (item.sizes?.length ? item.sizes[0] : null);
  const topping = toppingSelected && item.optionalTopping ? item.optionalTopping : null;
  const basePrice = chosenSize ? Number(chosenSize.price) : Number(item.price) || 0;
  const extra = topping ? Number(topping.price) || 0 : 0;
  const sizeLabel = chosenSize?.size || "";
  const toppingName = topping?.name || "";

  return {
    name: cartLineName(item.name, sizeLabel, toppingName),
    productName: item.name,
    size: sizeLabel || null,
    topping: toppingName || null,
    price: basePrice + extra,
    image: item.image,
    description: item.description,
    item_key: item.item_key,
    priceKey: priceKey(item, sizeLabel),
    category: item.category,
    isDrink: Boolean(item.isDrink),
  };
}

export function getFeaturedItems(menu) {
  const featured = [];
  menu.forEach((category) => {
    (category.items || []).forEach((item) => {
      if (item.featured) featured.push(item);
    });
  });
  return featured;
}

function addSizePair(aliases, base, size) {
  aliases.add(`${base} - ${size}`);
  aliases.add(`${base} (${size})`);
}

/** Dash/paren size names, plus تک نفره ↔ یک نفره so old ratings still match. */
export function nameAliases(name) {
  const aliases = new Set([name]);
  const raw = String(name).replace(/ \+ قارچ و پنیر$/, "");
  aliases.add(raw);

  const dash = raw.match(new RegExp(`^(.*) - (${SIZE_PATTERN})$`));
  const paren = raw.match(new RegExp(`^(.*) \\((${SIZE_PATTERN})\\)$`));
  const match = dash || paren;

  if (match) {
    const base = match[1];
    const size = match[2];
    aliases.add(base);
    addSizePair(aliases, base, size);
    if (size === "تک نفره") addSizePair(aliases, base, "یک نفره");
    if (size === "یک نفره") addSizePair(aliases, base, "تک نفره");
  } else {
    SIZE_LABELS.forEach((size) => addSizePair(aliases, raw, size));
  }

  return [...aliases];
}
