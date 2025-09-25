export type Enrollment = {
  id: string
  title: string
  price?: number
  progress?: number // 0..1
  startedAt?: string // ISO date
}

const KEY = "enrollments"

export function readEnrollments(): Enrollment[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Enrollment[]) : []
  } catch {
    return []
  }
}

export function writeEnrollments(items: Enrollment[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new Event("enrollments:update"))
}

export function addEnrollments(newItems: Array<Pick<Enrollment, "id" | "title" | "price">>) {
  const existing = readEnrollments()
  const map = new Map(existing.map((e) => [e.id, e]))
  newItems.forEach((ni) => {
    const prev = map.get(ni.id)
    if (!prev) {
      map.set(ni.id, {
        id: String(ni.id),
        title: ni.title,
        price: ni.price,
        progress: 0,
        startedAt: new Date().toISOString(),
      })
    }
  })
  writeEnrollments(Array.from(map.values()))
}

export function getEnrollmentById(id: string): Enrollment | undefined {
  return readEnrollments().find((e) => e.id === id)
}

export function updateEnrollmentProgress(id: string, progress: number) {
  const clamped = Math.max(0, Math.min(1, progress))
  const items = readEnrollments().map((e) => (e.id === id ? { ...e, progress: clamped } : e))
  writeEnrollments(items)
}
