"use client"

// Matches existing site styling (indigo + white/slate), mobile-first and accessible.

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { userService } from "@/services/userService"
import { authService } from "@/services/authService"
import { toast } from "sonner"

type Method = "gpay" | "phonepe" | "paytm" | "upi"

const UPI_ID = "edulearn@upi" // Update to your merchant UPI ID

function PaymentOption({
  method,
  label,
  imgSrc,
  upiId,
  selected,
  onSelect,
}: {
  method: Method
  label: string
  imgSrc: string
  upiId: string
  selected: boolean
  onSelect: (m: Method) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(method)}
      className={[
        "flex w-full items-center justify-between rounded-lg border p-3 transition",
        selected ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:bg-slate-50",
      ].join(" ")}
      aria-pressed={selected}
      aria-label={`Select ${label}`}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 overflow-hidden rounded">
          <Image
            src={imgSrc || "/placeholder.svg?height=32&width=32&query=payment%20brand%20icon"}
            alt={`${label} icon`}
            width={32}
            height={32}
            className="h-8 w-8 object-cover"
            priority
          />
        </div>
        <div className="text-left">
          <p className="font-medium text-slate-900">{label}</p>
          <p className="text-sm text-slate-600 truncate">{upiId}</p>
        </div>
      </div>
      <span
        className={[
          "h-5 w-5 rounded-full border",
          selected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 bg-white",
        ].join(" ")}
        aria-hidden="true"
      />
    </button>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clear } = useCart()

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 1), 0), [items])
  const discount = Math.min(20, subtotal)
  const total = subtotal - discount

  const [method, setMethod] = useState<Method>("gpay")
  const [processing, setProcessing] = useState(false)

  const selectedInfo = {
    gpay: {
      label: "Google Pay",
      imgSrc: "/images/qr-google-pay.jpg",
      upiId: UPI_ID,
      qrSrc: "/images/qr-google-pay.jpg",
    },
    phonepe: {
      label: "PhonePe",
      imgSrc: "/images/qr-phonepe.jpg",
      upiId: UPI_ID,
      qrSrc: "/images/qr-phonepe.jpg",
    },
    paytm: {
      label: "Paytm",
      imgSrc: "/images/qr-paytm.jpg",
      upiId: UPI_ID,
      qrSrc: "/images/qr-paytm.jpg",
    },
    upi: {
      label: "UPI (Generic)",
      imgSrc: "/images/qr-upi.jpg",
      upiId: UPI_ID,
      qrSrc: "/images/qr-upi.jpg",
    },
  }[method]

  const copyUPI = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID)
      alert("UPI ID copied")
    } catch {
      alert("Copy failed. Please copy manually.")
    }
  }

  const handleConfirm = async () => {
    if (!authService.isAuthenticated()) {
      toast.error("Please log in to complete your purchase")
      router.push("/login")
      return
    }

    if (items.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    setProcessing(true)

    try {
      // Process each course purchase individually
      const enrollmentPromises = items.map(async (item) => {
        try {
          // Create payment intent
          const paymentResponse = await userService.createPaymentIntent({
            courseId: item.id,
            amount: item.price,
            paymentMethod: method === "gpay" ? "card" : "bank_transfer",
            paymentGateway: method === "gpay" ? "razorpay" : "razorpay"
          })

          if (paymentResponse.success) {
            // Enroll in course after successful payment
            const enrollResponse = await userService.enrollInCourse(item.id)
            
            if (enrollResponse.success) {
              toast.success(`Successfully enrolled in ${item.title}!`)
              return { success: true, courseId: item.id, title: item.title }
            } else {
              throw new Error(`Failed to enroll in ${item.title}`)
            }
          } else {
            throw new Error(`Payment failed for ${item.title}`)
          }
        } catch (error) {
          console.error(`Error processing ${item.title}:`, error)
          toast.error(`Failed to process ${item.title}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          return { success: false, courseId: item.id, title: item.title, error }
        }
      })

      const results = await Promise.all(enrollmentPromises)
      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)

      if (successful.length > 0) {
        // Clear cart and redirect
        clear()
        
        if (failed.length === 0) {
          toast.success("All courses purchased successfully!")
        } else {
          toast.success(`${successful.length} courses purchased successfully. ${failed.length} failed.`)
        }
        
        router.push("/dashboard/my-courses")
      } else {
        toast.error("All purchases failed. Please try again.")
      }

    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Something went wrong during checkout. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-0">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-semibold text-white">Checkout</h1>
        <Button
          asChild
          variant="ghost"
          className="rounded-full text-white/90 hover:bg-white/10 self-start sm:self-auto"
        >
          <Link href="/dashboard/cart">Back to cart</Link>
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-white/10 bg-white">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-slate-900">Choose payment method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-6 pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <PaymentOption
                method="gpay"
                label="Google Pay"
                imgSrc="/images/qr-google-pay.jpg"
                upiId={UPI_ID}
                selected={method === "gpay"}
                onSelect={setMethod}
              />
              <PaymentOption
                method="phonepe"
                label="PhonePe"
                imgSrc="/images/qr-phonepe.jpg"
                upiId={UPI_ID}
                selected={method === "phonepe"}
                onSelect={setMethod}
              />
              <PaymentOption
                method="paytm"
                label="Paytm"
                imgSrc="/images/qr-paytm.jpg"
                upiId={UPI_ID}
                selected={method === "paytm"}
                onSelect={setMethod}
              />
              <PaymentOption
                method="upi"
                label="UPI (Generic)"
                imgSrc="/images/qr-upi.jpg"
                upiId={UPI_ID}
                selected={method === "upi"}
                onSelect={setMethod}
              />
            </div>

            <div className="mt-2 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="mb-3 text-sm font-medium text-slate-900">{selectedInfo.label} QR</p>
                <div className="flex items-center justify-center rounded-md border border-dashed border-slate-300 p-4">
                  <Image
                    src={selectedInfo.qrSrc || "/placeholder.svg?height=224&width=224&query=UPI%20QR%20code"}
                    alt={`${selectedInfo.label} QR code`}
                    width={224}
                    height={224}
                    className="h-40 w-40 sm:h-56 sm:w-56"
                    priority
                  />
                </div>
                <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button className="rounded-full bg-indigo-600 hover:bg-indigo-500" onClick={copyUPI}>
                    Copy UPI ID
                  </Button>
                  <a
                    href={selectedInfo.qrSrc}
                    download
                    className="rounded-full border border-slate-200 px-4 py-2 text-center text-slate-900 hover:bg-slate-50"
                  >
                    Download QR
                  </a>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-900">Instructions</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  <li>Open your {selectedInfo.label} app.</li>
                  <li>
                    Scan the QR or use UPI ID: <span className="font-medium text-slate-900 break-all">{UPI_ID}</span>
                  </li>
                  <li>Pay the total amount shown in the Summary.</li>
                  <li>After payment, click "I've paid" to complete your order.</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:p-6">
            <Button asChild variant="ghost" className="rounded-full text-slate-700 hover:bg-slate-100">
              <Link href="/dashboard/courses">Continue shopping</Link>
            </Button>
            <Button
              disabled={items.length === 0 || processing}
              onClick={handleConfirm}
              className="rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
            >
              {processing ? "Processing..." : "I've paid"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-white/10 bg-white">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-slate-900">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 md:p-6 pt-0">
            <div className="flex items-center justify-between text-slate-700">
              <span>Items</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>Discount</span>
              <span className="font-medium">-${discount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-900">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter className="p-4 md:p-6">
            <Button
              disabled={items.length === 0 || processing}
              onClick={handleConfirm}
              className="w-full rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
            >
              {processing ? "Processing..." : "I've paid — Complete order"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
