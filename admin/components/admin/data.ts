export type Course = {
  id: string
  title: string
  instructor: string
  price: number
  status: "Published" | "Draft"
  thumbnail?: string
}

export const sampleCourses: Course[] = [
  { id: "c1", title: "React Fundamentals", instructor: "Jane Doe", price: 49, status: "Published" },
  { id: "c2", title: "Advanced TypeScript", instructor: "John Smith", price: 69, status: "Draft" },
  { id: "c3", title: "TailwindCSS Mastery", instructor: "Ava Li", price: 59, status: "Published" },
  { id: "c4", title: "Node.js APIs", instructor: "Carlos Ruiz", price: 79, status: "Published" },
]

export type UserRow = {
  id: string
  name: string
  email: string
  enrolled: number
  status: "Active" | "Blocked"
}

export const sampleUsers: UserRow[] = [
  { id: "u1", name: "Emily Clark", email: "emily@example.com", enrolled: 3, status: "Active" },
  { id: "u2", name: "Mark Lee", email: "mark@example.com", enrolled: 1, status: "Active" },
  { id: "u3", name: "Priya Singh", email: "priya@example.com", enrolled: 5, status: "Blocked" },
  { id: "u4", name: "Tom B.", email: "tom@example.com", enrolled: 2, status: "Active" },
]

export type InstructorRow = {
  id: string
  name: string
  email: string
  totalCourses: number
  rating: number
  status: "Pending" | "Approved" | "Rejected"
}

export const sampleInstructors: InstructorRow[] = [
  { id: "i1", name: "Jane Doe", email: "jane@teach.io", totalCourses: 12, rating: 4.7, status: "Approved" },
  { id: "i2", name: "John Smith", email: "john@teach.io", totalCourses: 4, rating: 4.2, status: "Pending" },
  { id: "i3", name: "Ava Li", email: "ava@teach.io", totalCourses: 6, rating: 4.8, status: "Approved" },
]

export type PaymentRow = {
  id: string
  user: string
  course: string
  amount: number
  date: string
  status: "Paid" | "Refunded" | "Pending"
}

export const samplePayments: PaymentRow[] = [
  { id: "p1", user: "Emily Clark", course: "React Fundamentals", amount: 49, date: "2025-08-05", status: "Paid" },
  { id: "p2", user: "Mark Lee", course: "Advanced TypeScript", amount: 69, date: "2025-08-04", status: "Refunded" },
  { id: "p3", user: "Priya Singh", course: "TailwindCSS Mastery", amount: 59, date: "2025-08-02", status: "Paid" },
  { id: "p4", user: "Tom B.", course: "Node.js APIs", amount: 79, date: "2025-08-01", status: "Pending" },
]
