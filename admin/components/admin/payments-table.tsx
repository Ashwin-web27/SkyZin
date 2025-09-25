"use client"

import { useState, useEffect, useMemo } from "react"
import { samplePayments, type PaymentRow } from "./data"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

function toCSV(rows: PaymentRow[]) {
  const header = ["ID", "User", "Course", "Amount", "Date", "Status"]
  const body = rows.map((r) => [r.id, r.user, r.course, r.amount, r.date, r.status])
  const all = [header, ...body].map((line) => line.join(",")).join("\n")
  return all
}

interface Transaction {
  _id: string
  user: {
    _id: string
    name: string
    email: string
  }
  course: {
    _id: string
    title: string
    price: number
  }
  amount: number
  transactionId?: string
  status: 'Paid' | 'Pending' | 'Refunded' | 'completed' | 'pending' | 'failed'
  createdAt: string
  paymentMethod?: string
}

export function PaymentsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token') || localStorage.getItem('authToken') || localStorage.getItem('token')
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      
      // Try to fetch real transactions/payments
      let response
      try {
        response = await fetch('http://localhost:5000/api/admin/payments', { headers })
      } catch (e) {
        response = await fetch('http://localhost:5000/api/admin/transactions', { headers })
      }
      
      if (response.ok) {
        const result = await response.json()
        const data = result.data?.payments || result.data?.transactions || result.payments || result.transactions || result
        
        if (Array.isArray(data)) {
          setTransactions(data)
          console.log(`Loaded ${data.length} real transactions`)
        } else {
          throw new Error('Invalid data format')
        }
      } else {
        throw new Error(`API Error: ${response.status}`)
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error)
      setError(error.message)
      
      // Generate realistic sample data based on current enrollments
      try {
        const enrollResponse = await fetch('http://localhost:5000/api/admin/enrollments', { 
          headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
        })
        
        if (enrollResponse.ok) {
          const enrollData = await enrollResponse.json()
          const enrollments = enrollData.data?.enrollments || enrollData.enrollments || []
          
          // Create transaction records from enrollments
          const fakeTransactions = enrollments.slice(0, 20).map((enrollment: any, index: number) => {
            const statuses = ['Paid', 'Pending', 'Refunded']
            const randomStatus = statuses[Math.floor(Math.random() * 3)] as 'Paid' | 'Pending' | 'Refunded'
            
            return {
              _id: `txn_${enrollment._id || index}`,
              user: {
                _id: enrollment.user?._id || `user_${index}`,
                name: enrollment.user?.name || `User ${index + 1}`,
                email: enrollment.user?.email || `user${index}@example.com`
              },
              course: {
                _id: enrollment.course?._id || `course_${index}`,
                title: enrollment.course?.title || `Course ${index + 1}`,
                price: enrollment.course?.price || Math.floor(Math.random() * 100) + 30
              },
              amount: enrollment.course?.price || Math.floor(Math.random() * 100) + 30,
              status: randomStatus,
              createdAt: enrollment.createdAt || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
              transactionId: `TXN${Date.now()}${index}`
            }
          })
          
          setTransactions(fakeTransactions)
          toast.info('Using enrollment data to simulate transactions')
        } else {
          // Final fallback to sample data
          const fallbackTransactions = samplePayments.map(payment => ({
            _id: payment.id,
            user: {
              _id: `user_${payment.id}`,
              name: payment.user,
              email: `${payment.user.toLowerCase().replace(' ', '.')}@example.com`
            },
            course: {
              _id: `course_${payment.id}`,
              title: payment.course,
              price: payment.amount
            },
            amount: payment.amount,
            status: payment.status as 'Paid' | 'Pending' | 'Refunded',
            createdAt: new Date(payment.date).toISOString(),
            transactionId: `TXN${payment.id.toUpperCase()}`
          }))
          
          setTransactions(fallbackTransactions)
          toast.info('Using sample transaction data - connect to real payment system')
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        setTransactions([])
      }
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchTransactions()
  }, [])
  
  // Convert to PaymentRow format for CSV export
  const rows = useMemo(() => {
    return transactions.map(t => ({
      id: t._id,
      user: t.user.name,
      course: t.course.title,
      amount: t.amount,
      date: new Date(t.createdAt).toLocaleDateString(),
      status: t.status === 'completed' ? 'Paid' : t.status === 'failed' ? 'Refunded' : (t.status.charAt(0).toUpperCase() + t.status.slice(1)) as 'Paid' | 'Pending' | 'Refunded'
    }))
  }, [transactions])

  const downloadCSV = () => {
    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "payments.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPDF = () => {
    // Placeholder
    alert("PDF generation is a placeholder. Integrate a PDF library later.")
  }
  
  // Transaction management functions
  const updateTransactionStatus = async (transactionId: string, newStatus: 'Paid' | 'Pending' | 'Refunded') => {
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('authToken') || localStorage.getItem('token')
      
      const response = await fetch(`http://localhost:5000/api/admin/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus.toLowerCase() })
      })
      
      if (response.ok) {
        // Update local state
        setTransactions(prev => prev.map(t => 
          t._id === transactionId ? { ...t, status: newStatus } : t
        ))
        
        toast.success(`Transaction status updated to ${newStatus}`)
        
        // Trigger revenue update event for real-time dashboard refresh
        window.dispatchEvent(new CustomEvent('revenue-updated', {
          detail: { transactionId, status: newStatus }
        }))
        
        localStorage.setItem('revenue-updated', Date.now().toString())
      } else {
        throw new Error('Failed to update transaction')
      }
    } catch (error: any) {
      console.error('Error updating transaction:', error)
      toast.error(`Failed to update transaction: ${error.message}`)
    }
  }
  
  const processRefund = async (transactionId: string) => {
    if (!confirm('Are you sure you want to process a refund for this transaction?')) {
      return
    }
    
    await updateTransactionStatus(transactionId, 'Refunded')
  }
  
  const markAsPaid = async (transactionId: string) => {
    await updateTransactionStatus(transactionId, 'Paid')
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            <span>Loading transactions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transactions</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {transactions.length} total transactions
            {error && " (using fallback data)"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadCSV} disabled={transactions.length === 0}>
            Download CSV
          </Button>
          <Button onClick={downloadPDF} disabled={transactions.length === 0}>
            Download PDF
          </Button>
          <Button variant="outline" onClick={fetchTransactions}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions found</p>
            <Button onClick={fetchTransactions} className="mt-4">
              Retry
            </Button>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
                  const statusColor = transaction.status === 'Paid' || transaction.status === 'completed' 
                    ? 'text-green-600 bg-green-50' 
                    : transaction.status === 'Pending' || transaction.status === 'pending'
                    ? 'text-yellow-600 bg-yellow-50'
                    : 'text-red-600 bg-red-50'
                  
                  return (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.user.name}</div>
                          <div className="text-sm text-muted-foreground">{transaction.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={transaction.course.title}>
                          {transaction.course.title}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">₹{transaction.amount}</TableCell>
                      <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          {transaction.status === 'completed' ? 'Paid' : transaction.status === 'failed' ? 'Refunded' : transaction.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {transaction.transactionId || transaction._id.slice(-8)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {transaction.status === 'Pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsPaid(transaction._id)}
                              className="text-xs h-7 px-2"
                            >
                              Mark Paid
                            </Button>
                          )}
                          {(transaction.status === 'Paid' || transaction.status === 'completed') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => processRefund(transaction._id)}
                              className="text-xs h-7 px-2 text-red-600 hover:text-red-700"
                            >
                              Refund
                            </Button>
                          )}
                          {transaction.status === 'Refunded' && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              Refunded
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
