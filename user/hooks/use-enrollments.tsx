"use client"

import { useEffect, useState } from "react"
import type { Enrollment } from "@/lib/enrollment"
import { readEnrollments } from "@/lib/enrollment"

export function useEnrollments() {
  const [items, setItems] = useState<Enrollment[]>([])

  useEffect(() => {
    const load = () => setItems(readEnrollments())
    load()
    const handler = () => load()
    window.addEventListener("enrollments:update", handler)
    return () => window.removeEventListener("enrollments:update", handler)
  }, [])

  return { items }
}
