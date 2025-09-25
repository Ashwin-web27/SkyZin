// NOTE: Only import these in client components, since they use window/localStorage.

export type CartItem = {
  id: string
  title: string
  price: number
  qty: number
}

const KEY = "cart"

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(items))
  // Let any listeners (e.g., cart page) know that the cart changed.
  window.dispatchEvent(new Event("cart:update"))
}

export function addToCart(item: Omit<CartItem, "qty"> & Partial<Pick<CartItem, "qty">>) {
  const items = readCart()
  const idx = items.findIndex((i) => i.id === item.id)
  if (idx >= 0) {
    items[idx].qty += item.qty ?? 1
  } else {
    items.push({ ...item, qty: item.qty ?? 1 } as CartItem)
  }
  writeCart(items)
}

export function updateQty(id: string, qty: number) {
  const items = readCart().map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i))
  writeCart(items)
}

export function removeFromCart(id: string) {
  const items = readCart().filter((i) => i.id !== id)
  writeCart(items)
}

export function clearCart() {
  writeCart([])
}
