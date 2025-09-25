"use client"

import { PaymentsTable } from "@/components/admin/payments-table"
import { RevenueChart } from "@/components/admin/charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PaymentsPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Revenue Analytics</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <RevenueChart granular />
        </CardContent>
      </Card>
      <div className="grid gap-6">
        <PaymentsTable />
      </div>
    </div>
  )
}
