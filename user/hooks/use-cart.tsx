"use client"

import { useEffect, useState } from "react"
import type { CartItem } from "@/lib/cart"
import { readCart, updateQty, removeFromCart, clearCart as clearCartLib } from "@/lib/cart"

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const load = () => setItems(readCart())
    load()
    const handler = () => load()
    window.addEventListener("cart:update", handler)
    return () => window.removeEventListener("cart:update", handler)
  }, [])

  const inc = (id: string) => {
    const existing = readCart().find((i) => i.id === id)
    const nextQty = (existing?.qty ?? 1) + 1
    updateQty(id, nextQty)
  }

  const dec = (id: string) => {
    const existing = readCart().find((i) => i.id === id)
    const nextQty = Math.max(0, (existing?.qty ?? 1) - 1)
    if (nextQty <= 0) {
      removeFromCart(id)
    } else {
      updateQty(id, nextQty)
    }
  }

  const remove = (id: string) => removeFromCart(id)
  const clear = () => clearCartLib()

  return { items, inc, dec, remove, clear }
}
