const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  userName: {
    type: String,
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  courseName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded', 'Cancelled'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank_transfer', 'wallet'],
    required: [true, 'Payment method is required']
  },
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    unique: true
  },
  paymentGateway: {
    type: String,
    enum: ['stripe', 'paypal', 'razorpay', 'square'],
    required: [true, 'Payment gateway is required']
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String,
    default: null
  },
  refundedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  invoice: {
    invoiceNumber: String,
    invoiceUrl: String,
    generatedAt: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Create compound index for user and course
paymentSchema.index({ user: 1, course: 1 });

// Index for transaction lookup is handled by unique: true in schema

// Index for status and date filtering
paymentSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to generate invoice number
paymentSchema.pre('save', function(next) {
  if (this.isNew && this.status === 'Paid' && !this.invoice.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    this.invoice.invoiceNumber = `INV-${year}${month}${day}-${random}`;
    this.invoice.generatedAt = new Date();
  }
  next();
});

// Methods
paymentSchema.methods.markAsPaid = function() {
  this.status = 'Paid';
  return this.save();
};

paymentSchema.methods.markAsRefunded = function(amount, reason) {
  this.status = 'Refunded';
  this.refundAmount = amount || this.amount;
  this.refundReason = reason;
  this.refundedAt = new Date();
  return this.save();
};

// Virtual for net amount after refund
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.refundAmount;
});

// Ensure virtual fields are serialized
paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);