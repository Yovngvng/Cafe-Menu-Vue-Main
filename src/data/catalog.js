export const AVAILABILITY_CATEGORIES = ["آبمیوه", "کیک و دسر"];

export const STOCK_GROUPS = [
  {
    id: "juices",
    title: "آبمیوه‌ها",
    match: (category) => String(category).includes("آبمیوه"),
  },
  {
    id: "cakes",
    title: "کیک و دسر",
    match: (category) => {
      const name = String(category);
      return name.includes("کیک") || name.includes("دسر");
    },
  },
];

export function needsAvailability(category) {
  return STOCK_GROUPS.some((group) => group.match(category));
}

export const ICE_BOX_CATEGORY = "آیس باکس";

export const DRINK_CATEGORIES = new Set([
  "اسپرسو",
  "چای گرم",
  "دمنوش گرم",
  "بار گرم",
  "نوشیدنی گرم",
  "شیک",
  "نوشیدنی سرد",
  "آبمیوه",
  "بار سرد",
  "اسموتی",
  "فراپه",
  "آیس باکس",
]);

export function isIceBoxItem(item) {
  if (item?.isIceBox) return true;
  const category = String(item?.category || "");
  const name = String(item?.name || item?.productName || "");
  const key = String(item?.item_key || "");
  return (
    category === ICE_BOX_CATEGORY ||
    category.includes(ICE_BOX_CATEGORY) ||
    name.includes(ICE_BOX_CATEGORY) ||
    key.includes("آیس-باکس") ||
    key.includes("آیس باکس")
  );
}

export function isHolderDrink(item) {
  const drink = Boolean(item?.isDrink) || DRINK_CATEGORIES.has(item?.category);
  return drink && !isIceBoxItem(item);
}

export function makeItemKey(name, category = "") {
  const base = String(name).trim().replace(/\s+/g, "-");
  const cat = String(category).trim().replace(/\s+/g, "-");
  return cat ? `${cat}/${base}` : base;
}

export function priceKey(item, sizeLabel = "") {
  const base = item.item_key || makeItemKey(item.name, item.category);
  return sizeLabel ? `${base}::${sizeLabel}` : base;
}

export function enrichMenu(menu) {
  return (menu || []).map((category) => ({
    ...category,
    items: (category.items || []).map((item) => ({
      ...item,
      category: category.category,
      item_key: item.item_key || makeItemKey(item.name, category.category),
      isDrink: DRINK_CATEGORIES.has(category.category),
      isIceBox: category.category === ICE_BOX_CATEGORY,
      needsAvailability: needsAvailability(category.category),
    })),
  }));
}

export function applyPriceOverrides(menu, overrideMap = {}) {
  return (menu || []).map((category) => ({
    ...category,
    items: (category.items || []).map((item) => {
      if (item.sizes?.length) {
        return {
          ...item,
          sizes: item.sizes.map((size) => {
            const override = overrideMap[priceKey(item, size.size)];
            if (override == null) return size;
            return { ...size, price: Number(override) };
          }),
        };
      }
      const override = overrideMap[priceKey(item)];
      if (override == null) return item;
      return { ...item, price: Number(override) };
    }),
  }));
}

export function filterByAvailability(menu, availableKeys, options = {}) {
  if (options.apply === false) return menu;
  return (menu || []).map((category) => {
    if (!needsAvailability(category.category)) return category;
    return {
      ...category,
      items: (category.items || []).filter((item) => availableKeys.has(item.item_key)),
    };
  });
}

export function stockCatalog(menu) {
  const rows = [];
  (menu || []).forEach((category) => {
    if (!needsAvailability(category.category)) return;
    (category.items || []).forEach((item) => {
      rows.push({
        item_key: item.item_key,
        name: item.name,
        category: category.category,
      });
    });
  });
  return rows;
}

export function priceCatalog(menu) {
  const rows = [];
  (menu || []).forEach((category) => {
    (category.items || []).forEach((item) => {
      if (item.sizes?.length) {
        item.sizes.forEach((size) => {
          rows.push({
            key: priceKey(item, size.size),
            label: `${item.name} - ${size.size}`,
            category: category.category,
            staticPrice: Number(size.price) || 0,
          });
        });
      } else {
        rows.push({
          key: priceKey(item),
          label: item.name,
          category: category.category,
          staticPrice: Number(item.price) || 0,
        });
      }
    });
  });
  return rows;
}
