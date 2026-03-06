export type GuestCartItem = {
  productId: string;
  name: string;
  price: number;
  vendorName?: string;
  quantity: number;
};

const STORAGE_KEY = "mummyj2_cart";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadGuestCart(): GuestCartItem[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.productId === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.quantity === "number",
    );
  } catch {
    return [];
  }
}

export function saveGuestCart(items: GuestCartItem[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore write errors
  }
}

export function addGuestCartItem(newItem: GuestCartItem): void {
  const items = loadGuestCart();
  const existing = items.find((i) => i.productId === newItem.productId);
  if (existing) {
    existing.quantity += newItem.quantity;
  } else {
    items.push({ ...newItem });
  }
  saveGuestCart(items);
}

export function updateGuestCartItem(productId: string, quantity: number): void {
  const items = loadGuestCart();
  const next =
    quantity <= 0
      ? items.filter((i) => i.productId !== productId)
      : items.map((i) => (i.productId === productId ? { ...i, quantity } : i));
  saveGuestCart(next);
}

export function clearGuestCart(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

