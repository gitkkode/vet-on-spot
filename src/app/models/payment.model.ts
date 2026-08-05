export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other';
export type PaymentStatus = 'paid' | 'partial' | 'refunded' | 'waived';
export type BookingPaymentStatus = 'unpaid' | 'paid' | 'partial' | 'waived' | 'refunded';

export interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceNote?: string;
  recordedBy?: string;
  paidAt?: string;
  createdAt: string;
}
