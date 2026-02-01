export type CartItem = {
  productId: string;
  title: string;
  price: number; // cents
  quantity: number;
};

const STORAGE_KEY = 'mulu_cart';
const CART_UPDATED_EVENT = 'mulu_cart_updated';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function notifyCartUpdated() {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

function asNumber(value: unknown, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asPositiveInt(value: unknown, fallback = 1) {
  const n = asNumber(value, NaN);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}

function normalizeAndMerge(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];

  const map = new Map<string, CartItem>();

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as any;

    const productId = typeof e.productId === 'string' ? e.productId.trim() : '';
    if (!productId) continue;

    const title = typeof e.title === 'string' ? e.title.trim() : '';
    const price = Math.max(0, Math.round(asNumber(e.price, 0)));
    const quantity = asPositiveInt(e.quantity ?? e.qty, 1);

    const existing = map.get(productId);
    if (!existing) {
      map.set(productId, {
        productId,
        title: title || 'Untitled item',
        price,
        quantity,
      });
      continue;
    }

    map.set(productId, {
      productId,
      title: title || existing.title,
      price: Number.isFinite(price) ? price : existing.price,
      quantity: existing.quantity + quantity,
    });
  }

  return Array.from(map.values());
}

export function readCart(): CartItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeAndMerge(parsed);
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  if (!canUseStorage()) return;
  try {
    const normalized = normalizeAndMerge(items);
    if (normalized.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {
    // ignore
  } finally {
    notifyCartUpdated();
  }
}

export function addToCart(
  item: { productId: string; title: string; price: number },
  qtyToAdd: number = 1
): CartItem[] {
  const productId = typeof item?.productId === 'string' ? item.productId.trim() : '';
  if (!productId) {
    const current = readCart();
    writeCart(current);
    return current;
  }

  const nextQty = asPositiveInt(qtyToAdd, 1);
  const current = readCart();

  const idx = current.findIndex((x) => x.productId === productId);
  if (idx === -1) {
    const updated = [
      ...current,
      {
        productId,
        title: (typeof item.title === 'string' && item.title.trim()) || 'Untitled item',
        price: Math.max(0, Math.round(asNumber(item.price, 0))),
        quantity: nextQty,
      },
    ];
    writeCart(updated);
    return updated;
  }

  const existing = current[idx];
  const updated = current.slice();
  updated[idx] = {
    productId,
    title: (typeof item.title === 'string' && item.title.trim()) || existing.title,
    price: Math.max(0, Math.round(asNumber(item.price, existing.price))),
    quantity: existing.quantity + nextQty,
  };
  writeCart(updated);
  return updated;
}

export function setCartQuantity(productId: string, quantity: number): CartItem[] {
  const id = typeof productId === 'string' ? productId.trim() : '';
  const current = readCart();
  if (!id) {
    writeCart(current);
    return current;
  }

  const qRaw = asNumber(quantity, 0);
  if (!Number.isFinite(qRaw) || qRaw <= 0) {
    const updated = current.filter((x) => x.productId !== id);
    writeCart(updated);
    return updated;
  }

  const q = asPositiveInt(qRaw, 1);
  const updated = current.map((x) => (x.productId === id ? { ...x, quantity: q } : x));
  writeCart(updated);
  return updated;
}

export function removeFromCart(productId: string): CartItem[] {
  const id = typeof productId === 'string' ? productId.trim() : '';
  const current = readCart();
  const updated = id ? current.filter((x) => x.productId !== id) : current;
  writeCart(updated);
  return updated;
}

export function clearCart(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  } finally {
    notifyCartUpdated();
  }
}

