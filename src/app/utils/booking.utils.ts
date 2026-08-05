import type { Booking, BookingStatus } from '../models/booking.model';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  accepted: 'Accepted',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function getStatusLabel(status: BookingStatus): string {
  return STATUS_LABELS[status];
}

export function isSamePet(a: Booking, b: Booking): boolean {
  return (
    a.petName.toLowerCase() === b.petName.toLowerCase() &&
    a.customerName.toLowerCase() === b.customerName.toLowerCase()
  );
}

export function sortBookingsByPriority(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) => {
    if (a.isEmergency && !b.isEmergency) return -1;
    if (!a.isEmergency && b.isEmergency) return 1;
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });
}

/** Assign queue: emergency first, then newest submission time on top */
export function sortAppointmentsForAssign(
  bookings: Booking[],
  _todayIso = new Date().toISOString().slice(0, 10),
): Booking[] {
  return [...bookings].sort((a, b) => {
    if (a.isEmergency && !b.isEmergency) return -1;
    if (!a.isEmergency && b.isEmergency) return 1;

    const bySubmitted = getBookingSubmittedAt(b).localeCompare(getBookingSubmittedAt(a));
    if (bySubmitted !== 0) return bySubmitted;

    return b.id.localeCompare(a.id);
  });
}

export function getBookingSubmittedAt(booking: Booking): string {
  if (booking.submittedAt) return booking.submittedAt;
  const first = booking.history[0];
  if (first?.time && first.time !== '—' && first.time !== 'Now') {
    return `${booking.scheduledDate}T${first.time}:00`;
  }
  return `${booking.scheduledDate}T${booking.scheduledTime}:00`;
}

export function formatDateTimeSlot(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const monthDay = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const period = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 || 12;
  const min = minutes.toString().padStart(2, '0');
  return `${monthDay}, ${hour12}:${min} ${period}`;
}

export function formatSubmittedLabel(booking: Booking): string {
  const iso = getBookingSubmittedAt(booking);
  return formatDateTimeSlot(iso.slice(0, 10), iso.slice(11, 16));
}

export function formatDoctorVisitLabel(booking: Booking): string {
  return formatDateTimeSlot(booking.scheduledDate, booking.scheduledTime);
}

export function getAssignAppointmentTier(
  booking: Booking,
  todayIso = new Date().toISOString().slice(0, 10),
): 'emergency' | 'upcoming' | 'past' {
  if (booking.isEmergency) return 'emergency';
  if (booking.scheduledDate >= todayIso) return 'upcoming';
  return 'past';
}

export function getAcceptanceLabel(booking: Booking): string {
  if (booking.status === 'cancelled') return 'Cancelled';
  if (booking.assignedDoctor) return `Accepted by ${booking.assignedDoctor}`;
  if (booking.status === 'sent') return 'Awaiting doctor acceptance';
  if (booking.status === 'pending') return 'Not yet dispatched';
  return '—';
}

export function getEmergencySlaLabel(booking: Booking): string {
  if (!booking.isEmergency) return '';
  const limit = booking.mustReachWithinMinutes ?? 60;
  if (booking.estimatedArrivalMinutes != null) {
    return `ETA ${booking.estimatedArrivalMinutes} min — must reach within ${limit} min`;
  }
  return `Must reach within ${limit} minutes`;
}

export function getPaymentStatusLabel(status?: Booking['paymentStatus']): string {
  const map: Record<NonNullable<Booking['paymentStatus']>, string> = {
    unpaid: 'Unpaid',
    paid: 'Paid',
    partial: 'Partial',
    waived: 'Waived',
    refunded: 'Refunded',
  };
  return map[status || 'unpaid'] ?? 'Unpaid';
}

export function getPaymentStatusClass(status?: Booking['paymentStatus']): string {
  if (status === 'paid') return 'completed';
  if (status === 'partial') return 'sent';
  if (status === 'waived' || status === 'refunded') return 'cancelled';
  return 'pending';
}

export function formatFileLabel(value: string): string {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const pathname = new URL(value).pathname;
      const name = pathname.split('/').pop() || value;
      return decodeURIComponent(name.replace(/^\d+-/, ''));
    } catch {
      return value;
    }
  }
  return value;
}
