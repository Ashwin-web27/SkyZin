/**
 * Real-time purchase tracking utility
 * Communicates purchase events between user app and admin dashboard
 */

export interface PurchaseEvent {
  userId: string
  courseId: string
  courseName: string
  amount: number
  transactionId?: string
  timestamp: number
}

export class PurchaseTracker {
  /**
   * Track a course purchase and notify admin dashboard
   */
  static trackPurchase(purchaseData: PurchaseEvent) {
    console.log('Tracking course purchase:', purchaseData)
    
    try {
      // Dispatch custom event for same-window communication
      const event = new CustomEvent('course-purchased', {
        detail: purchaseData
      })
      window.dispatchEvent(event)
      
      // Use localStorage for cross-tab communication
      localStorage.setItem('course-purchased', JSON.stringify({
        ...purchaseData,
        timestamp: Date.now()
      }))
      
      // Also trigger revenue update event
      localStorage.setItem('revenue-updated', Date.now().toString())
      
      // Trigger enrollment created event
      const enrollmentEvent = new CustomEvent('enrollment-created', {
        detail: {
          courseId: purchaseData.courseId,
          userId: purchaseData.userId,
          amount: purchaseData.amount
        }
      })
      window.dispatchEvent(enrollmentEvent)
      
      localStorage.setItem('enrollment-created', JSON.stringify({
        courseId: purchaseData.courseId,
        userId: purchaseData.userId,
        timestamp: Date.now()
      }))
      
    } catch (error) {
      console.error('Error tracking purchase:', error)
    }
  }
  
  /**
   * Track payment completion
   */
  static trackPaymentCompletion(transactionId: string, status: 'completed' | 'failed') {
    console.log(`Payment ${status} for transaction:`, transactionId)
    
    try {
      const event = new CustomEvent('payment-completed', {
        detail: { transactionId, status, timestamp: Date.now() }
      })
      window.dispatchEvent(event)
      
      localStorage.setItem('payment-completed', JSON.stringify({
        transactionId,
        status,
        timestamp: Date.now()
      }))
      
      // Update revenue if payment completed
      if (status === 'completed') {
        localStorage.setItem('revenue-updated', Date.now().toString())
      }
      
    } catch (error) {
      console.error('Error tracking payment completion:', error)
    }
  }
  
  /**
   * Track enrollment update
   */
  static trackEnrollmentUpdate(courseId: string, userId: string, progress?: number) {
    try {
      const event = new CustomEvent('enrollment-updated', {
        detail: { courseId, userId, progress, timestamp: Date.now() }
      })
      window.dispatchEvent(event)
      
      localStorage.setItem('enrollment-updated', JSON.stringify({
        courseId,
        userId,
        progress,
        timestamp: Date.now()
      }))
      
    } catch (error) {
      console.error('Error tracking enrollment update:', error)
    }
  }
}

// Export convenience functions
export const trackPurchase = PurchaseTracker.trackPurchase
export const trackPaymentCompletion = PurchaseTracker.trackPaymentCompletion
export const trackEnrollmentUpdate = PurchaseTracker.trackEnrollmentUpdate