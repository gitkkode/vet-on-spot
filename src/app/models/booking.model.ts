import type { PetAppointmentForm } from './appointment-form.model';
import type { PetIcon } from '../components/icon/icon.types';

export type BookingStatus = 'pending' | 'sent' | 'accepted' | 'completed' | 'cancelled';
export type BookingType = 'online' | 'home' | 'clinic';
export type BookingPaymentStatus = 'unpaid' | 'paid' | 'partial' | 'waived' | 'refunded';

export interface BookingHistoryEntry {
  time: string;
  label: string;
  done: boolean;
}

export interface Booking {
  id: string;
  ownerId?: string;
  petId?: string;
  customerName: string;
  petName: string;
  petAge: string;
  petIcon: PetIcon;
  reason: string;
  service: string;
  type: BookingType;
  status: BookingStatus;
  location: string;
  area?: string;
  lat?: number;
  lng?: number;
  scheduledDate: string;
  scheduledTime: string;
  /** ISO datetime when the booking was submitted */
  submittedAt?: string;
  createdAt: string;
  isEmergency?: boolean;
  mustReachWithinMinutes?: number;
  estimatedArrivalMinutes?: number;
  assignedDoctor?: string;
  requestedDoctorIds?: string[];
  paymentStatus?: BookingPaymentStatus;
  paymentId?: string;
  details?: PetAppointmentForm;
  history: BookingHistoryEntry[];
}

export interface PetMedicationRecord {
  bookingId: string;
  visitDate: string;
  medicine: string;
  dosage: string;
  doctor?: string;
  notes?: string;
}
