export type DoctorStatus = 'available' | 'on-visit' | 'offline';

export interface Doctor {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  status: DoctorStatus;
  location: string;
  area?: string;
  lat?: number;
  lng?: number;
  visitsToday: number;
  rating: number;
  distanceKm?: number;
  mapX?: number;
  mapY?: number;
}

export type DoctorProfilePeriod = 'today' | 'yesterday' | 'weekly' | 'monthly';

export const DOCTOR_SPECIALTIES = [
  'General Practice',
  'Surgery',
  'Dermatology',
  'Emergency Care',
  'Exotic Animals',
  'Cardiology',
  'Orthopedics',
] as const;

export interface DoctorForm {
  name: string;
  specialty: string;
  location: string;
  mobile: string;
  email: string;
  rating: number | null;
  status: DoctorStatus | '';
}

export function createEmptyDoctorForm(): DoctorForm {
  return { name: '', specialty: '', location: '', mobile: '', email: '', rating: null, status: '' };
}
