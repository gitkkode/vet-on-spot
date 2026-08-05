import type { DoctorStatus } from '../models/doctor.model';

const DOCTOR_STATUS_LABELS: Record<DoctorStatus, string> = {
  available: 'Available',
  'on-visit': 'On Visit',
  offline: 'Offline',
};

export function getDoctorStatusLabel(status: DoctorStatus): string {
  return DOCTOR_STATUS_LABELS[status];
}
