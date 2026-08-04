export type BookingStatus = 'pending' | 'sent' | 'accepted' | 'completed' | 'cancelled';
export type BookingType = 'online' | 'home' | 'clinic';

import type { PetAppointmentForm } from '../models/appointment-form.model';
import type { PetIcon } from '../components/icon/icon.types';

export interface BookingHistoryEntry {
  time: string;
  label: string;
  done: boolean;
}

export interface Booking {
  id: string;
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
  details?: PetAppointmentForm;
  history: BookingHistoryEntry[];
}

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

export type VehicleStatus = 'available' | 'on-trip' | 'maintenance' | 'unavailable';

export interface Vehicle {
  id: string;
  driver?: string;
  assignedDoctor?: string;
  status: VehicleStatus;
  area?: string;
  lat?: number;
  lng?: number;
  ridesToday: number;
  kmToday: number;
  fuelPercent: number;
}

export type MapMarkerType = 'doctor' | 'vehicle' | 'customer';

export interface MapMarker {
  id: string;
  type: MapMarkerType;
  x: number;
  y: number;
  label: string;
  status: string;
}

export const BOOKINGS: Booking[] = [
  {
    id: 'BK-1043',
    customerName: 'Rachel Foster',
    petName: 'Duke',
    petAge: '6 years',
    petIcon: 'dog',
    reason: 'Hit by car — bleeding, difficulty breathing',
    service: 'Emergency Home Visit',
    type: 'home',
    status: 'pending',
    isEmergency: true,
    mustReachWithinMinutes: 60,
    location: 'HSR Layout, Sector 2, Bangalore',
    area: 'HSR Layout',
    lat: 12.9121,
    lng: 77.6446,
    scheduledDate: '2026-07-02',
    scheduledTime: '10:45',
    submittedAt: '2026-07-02T10:49:00',
    createdAt: '5 min ago',
    history: [
      { time: '10:49', label: 'Emergency booking created', done: true },
      { time: '—', label: 'Doctor must reach within 60 minutes', done: false },
    ],
  },
  {
    id: 'BK-1044',
    customerName: 'Kevin Brooks',
    petName: 'Bella',
    petAge: '8 years',
    petIcon: 'dog',
    reason: 'Sudden collapse — unresponsive',
    service: 'Emergency Home Visit',
    type: 'home',
    status: 'accepted',
    isEmergency: true,
    mustReachWithinMinutes: 60,
    estimatedArrivalMinutes: 28,
    location: 'Koramangala 5th Block, Bangalore',
    area: 'Koramangala',
    lat: 12.934,
    lng: 77.6287,
    scheduledDate: '2026-07-02',
    scheduledTime: '10:20',
    createdAt: '18 min ago',
    assignedDoctor: 'Dr. Tom Hughes',
    history: [
      { time: '10:32', label: 'Emergency booking created', done: true },
      { time: '10:34', label: 'Dispatched to Dr. Tom Hughes', done: true },
      { time: '10:36', label: 'Doctor accepted — ETA 28 min', done: true },
      { time: '—', label: 'Doctor en route (within 1 hr SLA)', done: false },
    ],
  },
  {
    id: 'BK-1042',
    customerName: 'Sarah Mitchell',
    petName: 'Max',
    petAge: '3 years',
    petIcon: 'dog',
    reason: 'Limping on front paw',
    service: 'Home Visit',
    type: 'home',
    status: 'pending',
    location: 'Indiranagar 100ft Road, Bangalore',
    area: 'Indiranagar',
    lat: 12.9784,
    lng: 77.6408,
    scheduledDate: '2026-07-05',
    scheduledTime: '17:30',
    submittedAt: '2026-07-02T10:40:00',
    createdAt: '12 min ago',
    history: [
      { time: '10:42', label: 'Booking created', done: true },
      { time: '—', label: 'Awaiting dispatch', done: false },
    ],
  },
  {
    id: 'BK-1041',
    customerName: 'James Chen',
    petName: 'Luna',
    petAge: '5 years',
    petIcon: 'cat',
    reason: 'Skin rash follow-up',
    service: 'Online Consult',
    type: 'online',
    status: 'sent',
    location: 'Koramangala — Video consult',
    area: 'Koramangala',
    lat: 12.9352,
    lng: 77.6245,
    scheduledDate: '2026-07-03',
    scheduledTime: '11:00',
    submittedAt: '2026-07-02T10:26:00',
    createdAt: '28 min ago',
    requestedDoctorIds: ['DR-02', 'DR-03'],
    history: [
      { time: '10:26', label: 'Booking created', done: true },
      { time: '10:30', label: 'Request sent to 2 doctors', done: true },
      { time: '—', label: 'Waiting for acceptance', done: false },
    ],
  },
  {
    id: 'BK-1040',
    customerName: 'Emily Rodriguez',
    petName: 'Buddy',
    petAge: '7 years',
    petIcon: 'dog',
    reason: 'Annual vaccination',
    service: 'Home Visit',
    type: 'home',
    status: 'accepted',
    location: 'Jayanagar 4th Block, Bangalore',
    area: 'Jayanagar',
    lat: 12.925,
    lng: 77.5938,
    scheduledDate: '2026-07-03',
    scheduledTime: '09:00',
    createdAt: '1 hr ago',
    assignedDoctor: 'Dr. Anita Rao',
    history: [
      { time: '09:45', label: 'Booking created', done: true },
      { time: '09:50', label: 'Request sent to Dr. Anita Rao', done: true },
      { time: '09:55', label: 'Doctor accepted', done: true },
    ],
  },
  {
    id: 'BK-1039',
    customerName: 'Michael Park',
    petName: 'Coco',
    petAge: '2 years',
    petIcon: 'rabbit',
    reason: 'Dental check',
    service: 'Online Consult',
    type: 'online',
    status: 'completed',
    location: 'Whitefield — Video consult',
    area: 'Whitefield',
    lat: 12.9698,
    lng: 77.7499,
    scheduledDate: '2026-07-01',
    scheduledTime: '08:30',
    createdAt: '2 hrs ago',
    assignedDoctor: 'Dr. Leo Martinez',
    history: [
      { time: '08:30', label: 'Booking created', done: true },
      { time: '08:35', label: 'Consultation completed', done: true },
    ],
  },
  {
    id: 'BK-1038',
    customerName: 'Priya Sharma',
    petName: 'Rocky',
    petAge: '4 years',
    petIcon: 'dog',
    reason: 'Post-surgery check',
    service: 'Home Visit',
    type: 'home',
    status: 'completed',
    location: 'Hebbal, Bangalore',
    area: 'Hebbal',
    lat: 13.0358,
    lng: 77.597,
    scheduledDate: '2026-07-01',
    scheduledTime: '14:00',
    createdAt: '3 hrs ago',
    assignedDoctor: 'Dr. Anita Rao',
    details: {
      owner: {
        fullName: 'Priya Sharma',
        mobile: '+1 555-0142',
        email: 'priya.sharma@email.com',
        address: '7 Birch Lane, Northgate',
        emergencyContact: 'Raj Sharma',
      },
      pet: {
        name: 'Rocky',
        species: 'Dog',
        breed: 'Labrador Retriever',
        gender: 'Male',
        ageOrDob: '4 years',
        weight: '32 kg',
        colorMarks: 'Golden, white chest patch',
        microchip: '985112004321567',
        neutered: 'Yes',
      },
      appointment: {
        bookingMode: 'normal',
        preferredDate: '2026-07-01',
        preferredTime: '14:00',
        consultationType: 'Home Visit',
        doctorPreference: 'Dr. Anita Rao',
        reasonForVisit: 'Post-surgery check — ACL repair recovery',
        additionalNotes: '',
      },
      health: {
        mainComplaint: 'Follow-up after ACL surgery',
        symptoms: 'Mild limping on right hind leg',
        sinceWhen: '2 weeks post-op',
        severity: 'Mild',
        appetite: 'Normal',
        waterIntake: 'Normal',
        urinationNormal: 'Yes',
        stoolNormal: 'Yes',
        vomiting: false,
        diarrhea: false,
        fever: false,
        coughing: false,
        sneezing: false,
        difficultyWalking: true,
        breathingDifficulty: false,
        painArea: 'Right hind leg',
        injuryAccident: '',
        problemMediaFiles: [],
      },
      pastMedical: {
        previousIllnesses: 'Hip dysplasia (managed)',
        previousSurgeries: 'ACL repair — right hind leg (Apr 2026)',
        previousHospitalization: '3 nights post ACL surgery',
        chronicDiseases: ['Arthritis'],
      },
      vaccination: {
        vaccinated: 'Yes',
        lastVaccinationDate: '2026-03-10',
        vaccineNames: 'Rabies, DHPP, Leptospirosis',
        vaccinationCardFiles: ['rocky-vaccination-2026.pdf'],
      },
      deworming: { lastDate: '2026-05-20', medicine: 'Drontal Plus' },
      tickFlea: { lastTreatmentDate: '2026-06-01', productUsed: 'Bravecto' },
      medications: {
        medicineName: 'Carprofen',
        dosage: '75 mg twice daily',
        sinceWhen: 'Since surgery (Apr 2026)',
        supplements: 'Glucosamine + Omega-3',
      },
      allergies: { medicine: 'None known', food: 'Chicken', environmental: 'Grass pollen (seasonal)' },
      diet: {
        foodType: 'Dry Food',
        brandName: 'Royal Canin Joint Care',
        feedingFrequency: 'Twice daily',
        treatsGiven: 'Dental chews (limited)',
      },
      lifestyle: {
        indoorOutdoor: 'Mostly indoor, short walks',
        exerciseLevel: 'Low (recovery)',
        contactOtherAnimals: 'Neighbour dog — Buddy',
        recentTravel: 'None',
        tickExposure: 'Low',
      },
      reproductive: { pregnant: 'No', lastHeatCycle: 'N/A', breedingHistory: 'Neutered', numberOfLitters: '0' },
      emergency: {
        isEmergency: false,
        bleeding: false,
        poisonIngestion: false,
        seizures: false,
        unconscious: false,
        difficultyBreathing: false,
      },
      documents: {
        prescriptions: ['carprofen-rx-mar2026.pdf'],
        bloodTests: ['pre-surgery-bloodwork-apr2026.pdf'],
        xray: ['acl-xray-apr2026.jpg'],
        ultrasound: [],
        vaccinationCard: ['rocky-vaccination-2026.pdf'],
        medicalRecords: ['acl-surgery-report-apr2026.pdf'],
        problemPhotos: [],
      },
      doctorNotes: {
        diagnosis: 'Post-operative ACL repair — healing well',
        clinicalFindings: 'Slight swelling at incision site; good range of motion',
        treatmentPlan: 'Continue restricted activity 2 more weeks; physiotherapy exercises',
        medicinesPrescribed: 'Carprofen 75mg BID × 10 days, then taper',
        labTestsRecommended: 'Follow-up X-ray in 4 weeks',
        followUpDate: '2026-07-29',
        nextVaccinationDate: '2027-03-10',
        nextDewormingDate: '2026-08-20',
      },
    },
    history: [
      { time: '07:15', label: 'Booking created', done: true },
      { time: '08:00', label: 'Visit completed', done: true },
      { time: '14:30', label: 'Doctor notes updated', done: true },
    ],
  },
  {
    id: 'BK-1025',
    customerName: 'Priya Sharma',
    petName: 'Rocky',
    petAge: '4 years',
    petIcon: 'dog',
    reason: 'ACL surgery — right hind leg',
    service: 'Home Visit',
    type: 'home',
    status: 'completed',
    location: 'Hebbal, Bangalore',
    area: 'Hebbal',
    lat: 13.0358,
    lng: 77.597,
    scheduledDate: '2026-04-15',
    scheduledTime: '09:00',
    createdAt: '3 months ago',
    assignedDoctor: 'Dr. Anita Rao',
    details: {
      owner: {
        fullName: 'Priya Sharma',
        mobile: '+1 555-0142',
        email: 'priya.sharma@email.com',
        address: '7 Birch Lane, Northgate',
        emergencyContact: 'Raj Sharma',
      },
      pet: {
        name: 'Rocky',
        species: 'Dog',
        breed: 'Labrador Retriever',
        gender: 'Male',
        ageOrDob: '4 years',
        weight: '31 kg',
        colorMarks: 'Golden, white chest patch',
        microchip: '985112004321567',
        neutered: 'Yes',
      },
      appointment: {
        bookingMode: 'normal',
        preferredDate: '2026-04-15',
        preferredTime: '09:00',
        consultationType: 'Home Visit',
        doctorPreference: 'Dr. Anita Rao',
        reasonForVisit: 'ACL rupture — surgical repair',
        additionalNotes: '',
      },
      health: {
        mainComplaint: 'Sudden lameness after playing fetch',
        symptoms: 'Non-weight-bearing on right hind leg',
        sinceWhen: '3 days',
        severity: 'Severe',
        appetite: 'Reduced',
        waterIntake: 'Normal',
        urinationNormal: 'Yes',
        stoolNormal: 'Yes',
        vomiting: false,
        diarrhea: false,
        fever: false,
        coughing: false,
        sneezing: false,
        difficultyWalking: true,
        breathingDifficulty: false,
        painArea: 'Right knee',
        injuryAccident: 'Twisted while running',
        problemMediaFiles: ['rocky-limp-video.mp4'],
      },
      pastMedical: {
        previousIllnesses: 'Hip dysplasia',
        previousSurgeries: 'None prior',
        previousHospitalization: 'None',
        chronicDiseases: ['Arthritis'],
      },
      vaccination: {
        vaccinated: 'Yes',
        lastVaccinationDate: '2026-03-10',
        vaccineNames: 'Rabies, DHPP',
        vaccinationCardFiles: [],
      },
      deworming: { lastDate: '2026-02-15', medicine: 'Drontal Plus' },
      tickFlea: { lastTreatmentDate: '2026-03-01', productUsed: 'Bravecto' },
      medications: {
        medicineName: 'Meloxicam',
        dosage: '1.5 mg daily',
        sinceWhen: 'Pre-surgery (3 days)',
        supplements: '',
      },
      allergies: { medicine: 'None known', food: 'Chicken', environmental: 'Grass pollen' },
      diet: { foodType: 'Dry Food', brandName: 'Royal Canin', feedingFrequency: 'Twice daily', treatsGiven: 'Occasional' },
      lifestyle: {
        indoorOutdoor: 'Indoor/outdoor',
        exerciseLevel: 'High (before injury)',
        contactOtherAnimals: 'Neighbour dog',
        recentTravel: 'None',
        tickExposure: 'Low',
      },
      reproductive: { pregnant: 'No', lastHeatCycle: 'N/A', breedingHistory: 'Neutered', numberOfLitters: '0' },
      emergency: {
        isEmergency: false,
        bleeding: false,
        poisonIngestion: false,
        seizures: false,
        unconscious: false,
        difficultyBreathing: false,
      },
      documents: {
        prescriptions: [],
        bloodTests: ['pre-surgery-bloodwork-apr2026.pdf'],
        xray: ['acl-xray-apr2026.jpg'],
        ultrasound: [],
        vaccinationCard: [],
        medicalRecords: ['acl-surgery-report-apr2026.pdf'],
        problemPhotos: ['rocky-limp-video.mp4'],
      },
      doctorNotes: {
        diagnosis: 'Cranial cruciate ligament rupture — right stifle',
        clinicalFindings: 'Positive cranial drawer test; muscle atrophy right thigh',
        treatmentPlan: 'TPLO surgery performed; crate rest 6 weeks',
        medicinesPrescribed: 'Meloxicam 1.5mg daily × 5 days, then Carprofen 75mg BID',
        labTestsRecommended: 'Post-op X-ray at 2 weeks',
        followUpDate: '2026-04-29',
        nextVaccinationDate: '2027-03-10',
        nextDewormingDate: '2026-05-20',
      },
    },
    history: [
      { time: '09:00', label: 'Surgery booking created', done: true },
      { time: '11:30', label: 'Surgery completed', done: true },
      { time: '12:00', label: 'Recovery instructions given', done: true },
    ],
  },
  {
    id: 'BK-1037',
    customerName: 'David Wilson',
    petName: 'Milo',
    petAge: '1 year',
    petIcon: 'cat',
    reason: 'Vomiting — urgent',
    service: 'Home Visit',
    type: 'home',
    status: 'cancelled',
    location: 'Electronic City Phase 1, Bangalore',
    area: 'Electronic City',
    lat: 12.8456,
    lng: 77.6603,
    scheduledDate: '2026-07-05',
    scheduledTime: '16:30',
    createdAt: '4 hrs ago',
    history: [
      { time: '06:20', label: 'Booking created', done: true },
      { time: '06:35', label: 'Cancelled by customer', done: true },
    ],
  },
];

/** Demo “today” offsets so doctor profiles always have live period data. */
function demoIso(daysFromToday: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Seeded bookings covering requests / pending / completed / history for every doctor. */
const DOCTOR_PROFILE_DEMO_BOOKINGS: Booking[] = [
  // ── Dr. Anita Rao (DR-01) ──────────────────────────────────────────────
  {
    id: 'BK-D101',
    customerName: 'Neha Kapoor',
    petName: 'Bruno',
    petAge: '4 years',
    petIcon: 'dog',
    reason: 'Vaccination due — annual booster',
    service: 'Home Visit',
    type: 'home',
    status: 'sent',
    location: 'Marathahalli Bridge, Bangalore',
    area: 'Marathahalli',
    lat: 12.958,
    lng: 77.701,
    scheduledDate: demoIso(0),
    scheduledTime: '11:00',
    createdAt: '20 min ago',
    requestedDoctorIds: ['DR-01'],
    history: [
      { time: '09:10', label: 'Booking created', done: true },
      { time: '09:15', label: 'Request sent to Dr. Anita Rao', done: true },
    ],
  },
  {
    id: 'BK-D102',
    customerName: 'Arjun Mehta',
    petName: 'Coco',
    petAge: '2 years',
    petIcon: 'cat',
    reason: 'Ear infection — shaking head',
    service: 'Home Visit',
    type: 'home',
    status: 'sent',
    isEmergency: true,
    mustReachWithinMinutes: 60,
    location: 'Kadubeesanahalli, Bangalore',
    area: 'Marathahalli',
    lat: 12.94,
    lng: 77.695,
    scheduledDate: demoIso(0),
    scheduledTime: '12:30',
    createdAt: '8 min ago',
    requestedDoctorIds: ['DR-01'],
    history: [
      { time: '10:02', label: 'Emergency booking created', done: true },
      { time: '10:04', label: 'Request sent to Dr. Anita Rao', done: true },
    ],
  },
  {
    id: 'BK-D103',
    customerName: 'Priya Shah',
    petName: 'Rocky',
    petAge: '6 years',
    petIcon: 'dog',
    reason: 'Routine checkup',
    service: 'Home Visit',
    type: 'home',
    status: 'accepted',
    location: 'Bellandur, Bangalore',
    area: 'Bellandur',
    lat: 12.93,
    lng: 77.678,
    scheduledDate: demoIso(0),
    scheduledTime: '15:00',
    createdAt: '1 hr ago',
    assignedDoctor: 'Dr. Anita Rao',
    history: [
      { time: '08:40', label: 'Booking created', done: true },
      { time: '08:55', label: 'Accepted by Dr. Anita Rao', done: true },
    ],
  },
  {
    id: 'BK-D104',
    customerName: 'Vikram Iyer',
    petName: 'Misty',
    petAge: '3 years',
    petIcon: 'cat',
    reason: 'Dental cleaning follow-up',
    service: 'Clinic Visit',
    type: 'clinic',
    status: 'accepted',
    location: 'VetOnSpot Clinic — Whitefield',
    area: 'Whitefield',
    scheduledDate: demoIso(0),
    scheduledTime: '16:30',
    createdAt: '2 hrs ago',
    assignedDoctor: 'Dr. Anita Rao',
    history: [
      { time: '07:20', label: 'Booking created', done: true },
      { time: '07:40', label: 'Accepted by Dr. Anita Rao', done: true },
    ],
  },
  {
    id: 'BK-D105',
    customerName: 'Sana Reddy',
    petName: 'Toby',
    petAge: '5 years',
    petIcon: 'dog',
    reason: 'Skin allergy review',
    service: 'Online Consult',
    type: 'online',
    status: 'completed',
    location: 'Online',
    scheduledDate: demoIso(0),
    scheduledTime: '09:00',
    createdAt: 'Yesterday',
    assignedDoctor: 'Dr. Anita Rao',
    history: [
      { time: '09:00', label: 'Consult started', done: true },
      { time: '09:25', label: 'Visit completed', done: true },
    ],
  },
  {
    id: 'BK-D106',
    customerName: 'Rahul Das',
    petName: 'Pepper',
    petAge: '1 year',
    petIcon: 'rabbit',
    reason: 'Post-op wound check',
    service: 'Home Visit',
    type: 'home',
    status: 'completed',
    location: 'Marathahalli, Bangalore',
    area: 'Marathahalli',
    scheduledDate: demoIso(-1),
    scheduledTime: '14:00',
    createdAt: 'Yesterday',
    assignedDoctor: 'Dr. Anita Rao',
    history: [
      { time: '14:00', label: 'Visit started', done: true },
      { time: '14:40', label: 'Visit completed', done: true },
    ],
  },
  {
    id: 'BK-D107',
    customerName: 'Meera Nair',
    petName: 'Shadow',
    petAge: '7 years',
    petIcon: 'dog',
    reason: 'Blood work follow-up',
    service: 'Home Visit',
    type: 'home',
    status: 'completed',
    location: 'Sarjapur Road, Bangalore',
    area: 'Sarjapur',
    scheduledDate: demoIso(-3),
    scheduledTime: '11:30',
    createdAt: '3 days ago',
    assignedDoctor: 'Dr. Anita Rao',
    history: [
      { time: '11:30', label: 'Visit started', done: true },
      { time: '12:10', label: 'Visit completed', done: true },
    ],
  },

  // ── Dr. Leo Martinez (DR-02) ───────────────────────────────────────────
  {
    id: 'BK-D201',
    customerName: 'Olivia Grant',
    petName: 'Rex',
    petAge: '4 years',
    petIcon: 'dog',
    reason: 'Suspected fracture — limping severely',
    service: 'Emergency Home Visit',
    type: 'home',
    status: 'sent',
    isEmergency: true,
    mustReachWithinMinutes: 60,
    location: 'Whitefield Main Road, Bangalore',
    area: 'Whitefield',
    scheduledDate: demoIso(0),
    scheduledTime: '10:15',
    createdAt: '15 min ago',
    requestedDoctorIds: ['DR-02'],
    history: [
      { time: '09:50', label: 'Emergency booking created', done: true },
      { time: '09:52', label: 'Request sent to Dr. Leo Martinez', done: true },
    ],
  },
  {
    id: 'BK-D202',
    customerName: 'Daniel Cruz',
    petName: 'Nala',
    petAge: '3 years',
    petIcon: 'cat',
    reason: 'Spay consultation',
    service: 'Clinic Visit',
    type: 'clinic',
    status: 'sent',
    location: 'VetOnSpot Clinic — Whitefield',
    area: 'Whitefield',
    scheduledDate: demoIso(1),
    scheduledTime: '13:00',
    createdAt: '40 min ago',
    requestedDoctorIds: ['DR-02'],
    history: [
      { time: '08:30', label: 'Booking created', done: true },
      { time: '08:45', label: 'Request sent to Dr. Leo Martinez', done: true },
    ],
  },
  {
    id: 'BK-D203',
    customerName: 'Hannah Lee',
    petName: 'Koda',
    petAge: '2 years',
    petIcon: 'dog',
    reason: 'Pre-surgery checkup',
    service: 'Clinic Visit',
    type: 'clinic',
    status: 'accepted',
    location: 'VetOnSpot Clinic — Whitefield',
    area: 'Whitefield',
    scheduledDate: demoIso(0),
    scheduledTime: '14:00',
    createdAt: '3 hrs ago',
    assignedDoctor: 'Dr. Leo Martinez',
    history: [
      { time: '07:00', label: 'Booking created', done: true },
      { time: '07:20', label: 'Accepted by Dr. Leo Martinez', done: true },
    ],
  },
  {
    id: 'BK-D204',
    customerName: 'Marcus Webb',
    petName: 'Ziggy',
    petAge: '8 years',
    petIcon: 'dog',
    reason: 'Tumor removal follow-up',
    service: 'Home Visit',
    type: 'home',
    status: 'accepted',
    location: 'ITPL Road, Bangalore',
    area: 'Whitefield',
    scheduledDate: demoIso(0),
    scheduledTime: '17:00',
    createdAt: '4 hrs ago',
    assignedDoctor: 'Dr. Leo Martinez',
    history: [
      { time: '06:50', label: 'Booking created', done: true },
      { time: '07:10', label: 'Accepted by Dr. Leo Martinez', done: true },
    ],
  },
  {
    id: 'BK-D205',
    customerName: 'Elena Soto',
    petName: 'Mango',
    petAge: '1 year',
    petIcon: 'bird',
    reason: 'Wing injury assessment',
    service: 'Clinic Visit',
    type: 'clinic',
    status: 'completed',
    location: 'VetOnSpot Clinic — Whitefield',
    scheduledDate: demoIso(0),
    scheduledTime: '08:30',
    createdAt: 'Today',
    assignedDoctor: 'Dr. Leo Martinez',
    history: [
      { time: '08:30', label: 'Visit started', done: true },
      { time: '09:05', label: 'Visit completed', done: true },
    ],
  },
  {
    id: 'BK-D206',
    customerName: 'Chris Patel',
    petName: 'Biscuit',
    petAge: '5 years',
    petIcon: 'dog',
    reason: 'ACL surgery recovery check',
    service: 'Home Visit',
    type: 'home',
    status: 'completed',
    location: 'Varthur, Bangalore',
    area: 'Whitefield',
    scheduledDate: demoIso(-2),
    scheduledTime: '16:00',
    createdAt: '2 days ago',
    assignedDoctor: 'Dr. Leo Martinez',
    history: [
      { time: '16:00', label: 'Visit started', done: true },
      { time: '16:45', label: 'Visit completed', done: true },
    ],
  },

  // ── Dr. Priya Nair (DR-03) ─────────────────────────────────────────────
  {
    id: 'BK-D301',
    customerName: 'Aisha Khan',
    petName: 'Simba',
    petAge: '4 years',
    petIcon: 'cat',
    reason: 'Hot spots / dermatitis flare',
    service: 'Home Visit',
    type: 'home',
    status: 'sent',
    location: 'Indiranagar 12th Main, Bangalore',
    area: 'Indiranagar',
    scheduledDate: demoIso(0),
    scheduledTime: '11:45',
    createdAt: '25 min ago',
    requestedDoctorIds: ['DR-03'],
    history: [
      { time: '09:20', label: 'Booking created', done: true },
      { time: '09:28', label: 'Request sent to Dr. Priya Nair', done: true },
    ],
  },
  {
    id: 'BK-D302',
    customerName: 'Rohan Gupta',
    petName: 'Daisy',
    petAge: '6 years',
    petIcon: 'dog',
    reason: 'Allergy testing consult',
    service: 'Online Consult',
    type: 'online',
    status: 'sent',
    location: 'Online',
    scheduledDate: demoIso(0),
    scheduledTime: '18:00',
    createdAt: '55 min ago',
    requestedDoctorIds: ['DR-03'],
    history: [
      { time: '08:50', label: 'Booking created', done: true },
      { time: '09:00', label: 'Request sent to Dr. Priya Nair', done: true },
    ],
  },
  {
    id: 'BK-D303',
    customerName: 'Fatima Ali',
    petName: 'Oreo',
    petAge: '2 years',
    petIcon: 'cat',
    reason: 'Fungal infection treatment',
    service: 'Home Visit',
    type: 'home',
    status: 'accepted',
    location: 'Domlur, Bangalore',
    area: 'Indiranagar',
    scheduledDate: demoIso(0),
    scheduledTime: '13:30',
    createdAt: '2 hrs ago',
    assignedDoctor: 'Dr. Priya Nair',
    history: [
      { time: '07:45', label: 'Booking created', done: true },
      { time: '08:05', label: 'Accepted by Dr. Priya Nair', done: true },
    ],
  },
  {
    id: 'BK-D304',
    customerName: 'Jake Morrison',
    petName: 'Lola',
    petAge: '3 years',
    petIcon: 'dog',
    reason: 'Itchy paws — possible allergy',
    service: 'Clinic Visit',
    type: 'clinic',
    status: 'accepted',
    location: 'VetOnSpot Clinic — Indiranagar',
    area: 'Indiranagar',
    scheduledDate: demoIso(0),
    scheduledTime: '15:45',
    createdAt: '3 hrs ago',
    assignedDoctor: 'Dr. Priya Nair',
    history: [
      { time: '07:10', label: 'Booking created', done: true },
      { time: '07:30', label: 'Accepted by Dr. Priya Nair', done: true },
    ],
  },
  {
    id: 'BK-D305',
    customerName: 'Tara Singh',
    petName: 'Muffin',
    petAge: '5 years',
    petIcon: 'cat',
    reason: 'Skin scrape follow-up',
    service: 'Home Visit',
    type: 'home',
    status: 'completed',
    location: 'Halasuru, Bangalore',
    area: 'Indiranagar',
    scheduledDate: demoIso(0),
    scheduledTime: '09:30',
    createdAt: 'Today',
    assignedDoctor: 'Dr. Priya Nair',
    history: [
      { time: '09:30', label: 'Visit started', done: true },
      { time: '10:05', label: 'Visit completed', done: true },
    ],
  },
  {
    id: 'BK-D306',
    customerName: 'Ben Carter',
    petName: 'Willow',
    petAge: '4 years',
    petIcon: 'dog',
    reason: 'Medicated bath + skin review',
    service: 'Clinic Visit',
    type: 'clinic',
    status: 'completed',
    location: 'VetOnSpot Clinic — Indiranagar',
    scheduledDate: demoIso(-4),
    scheduledTime: '12:00',
    createdAt: '4 days ago',
    assignedDoctor: 'Dr. Priya Nair',
    history: [
      { time: '12:00', label: 'Visit started', done: true },
      { time: '12:50', label: 'Visit completed', done: true },
    ],
  },

  // ── Dr. Tom Hughes (DR-04) ────────────────────────────────────────────
  {
    id: 'BK-D401',
    customerName: 'Nina Brooks',
    petName: 'Ace',
    petAge: '7 years',
    petIcon: 'dog',
    reason: 'Seizure episode — urgent',
    service: 'Emergency Home Visit',
    type: 'home',
    status: 'sent',
    location: 'HSR Layout Sector 6, Bangalore',
    area: 'HSR Layout',
    scheduledDate: demoIso(0),
    scheduledTime: '10:00',
    createdAt: '6 min ago',
    requestedDoctorIds: ['DR-04'],
    history: [
      { time: '10:04', label: 'Booking created', done: true },
      { time: '10:05', label: 'Request sent to Dr. Tom Hughes', done: true },
    ],
  },
  {
    id: 'BK-D402',
    customerName: 'Omar Hassan',
    petName: 'Kiwi',
    petAge: '2 years',
    petIcon: 'bird',
    reason: 'Breathing distress',
    service: 'Home Visit',
    type: 'home',
    status: 'sent',
    location: 'Bommanahalli, Bangalore',
    area: 'HSR Layout',
    scheduledDate: demoIso(0),
    scheduledTime: '11:20',
    createdAt: '12 min ago',
    requestedDoctorIds: ['DR-04'],
    history: [
      { time: '09:58', label: 'Booking created', done: true },
      { time: '10:00', label: 'Request sent to Dr. Tom Hughes', done: true },
    ],
  },
  {
    id: 'BK-D403',
    customerName: 'Lisa Park',
    petName: 'Bolt',
    petAge: '3 years',
    petIcon: 'dog',
    reason: 'Heatstroke recovery monitoring',
    service: 'Home Visit',
    type: 'home',
    status: 'accepted',
    location: 'HSR Layout Sector 2, Bangalore',
    area: 'HSR Layout',
    scheduledDate: demoIso(0),
    scheduledTime: '14:30',
    createdAt: '1 hr ago',
    assignedDoctor: 'Dr. Tom Hughes',
    history: [
      { time: '08:20', label: 'Booking created', done: true },
      { time: '08:35', label: 'Accepted by Dr. Tom Hughes', done: true },
    ],
  },
  {
    id: 'BK-D404',
    customerName: 'Samir Joshi',
    petName: 'Chico',
    petAge: '9 years',
    petIcon: 'dog',
    reason: 'IV fluids — dehydration',
    service: 'Home Visit',
    type: 'home',
    status: 'accepted',
    location: 'Agara Lake Rd, Bangalore',
    area: 'HSR Layout',
    scheduledDate: demoIso(0),
    scheduledTime: '16:00',
    createdAt: '90 min ago',
    assignedDoctor: 'Dr. Tom Hughes',
    history: [
      { time: '07:50', label: 'Booking created', done: true },
      { time: '08:10', label: 'Accepted by Dr. Tom Hughes', done: true },
    ],
  },
  {
    id: 'BK-D405',
    customerName: 'Grace Kim',
    petName: 'Panda',
    petAge: '1 year',
    petIcon: 'cat',
    reason: 'Toxic ingestion — stabilized',
    service: 'Home Visit',
    type: 'home',
    status: 'completed',
    location: 'HSR Layout, Bangalore',
    area: 'HSR Layout',
    scheduledDate: demoIso(0),
    scheduledTime: '07:45',
    createdAt: 'Today',
    assignedDoctor: 'Dr. Tom Hughes',
    history: [
      { time: '07:45', label: 'Visit started', done: true },
      { time: '08:40', label: 'Visit completed', done: true },
    ],
  },
  {
    id: 'BK-D406',
    customerName: 'Paul Rivera',
    petName: 'Scout',
    petAge: '5 years',
    petIcon: 'dog',
    reason: 'Trauma follow-up after accident',
    service: 'Home Visit',
    type: 'home',
    status: 'completed',
    location: 'Silk Board, Bangalore',
    area: 'HSR Layout',
    scheduledDate: demoIso(-1),
    scheduledTime: '19:00',
    createdAt: 'Yesterday',
    assignedDoctor: 'Dr. Tom Hughes',
    history: [
      { time: '19:00', label: 'Visit started', done: true },
      { time: '19:50', label: 'Visit completed', done: true },
    ],
  },

  // ── Dr. Sofia Kim (DR-05) ──────────────────────────────────────────────
  {
    id: 'BK-D501',
    customerName: 'Helen Cho',
    petName: 'Kiara',
    petAge: '2 years',
    petIcon: 'bird',
    reason: 'Beak trim + wellness',
    service: 'Clinic Visit',
    type: 'clinic',
    status: 'sent',
    location: 'VetOnSpot Clinic — Koramangala',
    area: 'Koramangala',
    scheduledDate: demoIso(1),
    scheduledTime: '12:00',
    createdAt: '1 hr ago',
    requestedDoctorIds: ['DR-05'],
    history: [
      { time: '08:00', label: 'Booking created', done: true },
      { time: '08:20', label: 'Request sent to Dr. Sofia Kim', done: true },
    ],
  },
  {
    id: 'BK-D502',
    customerName: 'Ian Brooks',
    petName: 'Thumper',
    petAge: '3 years',
    petIcon: 'rabbit',
    reason: 'GI stasis concern',
    service: 'Home Visit',
    type: 'home',
    status: 'sent',
    location: 'Jayanagar, Bangalore',
    area: 'Jayanagar',
    scheduledDate: demoIso(0),
    scheduledTime: '15:00',
    createdAt: '35 min ago',
    requestedDoctorIds: ['DR-05'],
    history: [
      { time: '09:05', label: 'Booking created', done: true },
      { time: '09:18', label: 'Request sent to Dr. Sofia Kim', done: true },
    ],
  },
  {
    id: 'BK-D503',
    customerName: 'Maya Chen',
    petName: 'Sunny',
    petAge: '4 years',
    petIcon: 'bird',
    reason: 'Feather plucking consult',
    service: 'Online Consult',
    type: 'online',
    status: 'accepted',
    location: 'Online',
    scheduledDate: demoIso(0),
    scheduledTime: '17:30',
    createdAt: '2 hrs ago',
    assignedDoctor: 'Dr. Sofia Kim',
    history: [
      { time: '07:30', label: 'Booking created', done: true },
      { time: '07:50', label: 'Accepted by Dr. Sofia Kim', done: true },
    ],
  },
  {
    id: 'BK-D504',
    customerName: 'Peter Novak',
    petName: 'Clover',
    petAge: '1 year',
    petIcon: 'rabbit',
    reason: 'Dental overgrowth',
    service: 'Clinic Visit',
    type: 'clinic',
    status: 'accepted',
    location: 'VetOnSpot Clinic — Koramangala',
    scheduledDate: demoIso(0),
    scheduledTime: '11:00',
    createdAt: '3 hrs ago',
    assignedDoctor: 'Dr. Sofia Kim',
    history: [
      { time: '06:40', label: 'Booking created', done: true },
      { time: '07:00', label: 'Accepted by Dr. Sofia Kim', done: true },
    ],
  },
  {
    id: 'BK-D505',
    customerName: 'Julia West',
    petName: 'Rio',
    petAge: '6 years',
    petIcon: 'bird',
    reason: 'Annual exotic wellness',
    service: 'Clinic Visit',
    type: 'clinic',
    status: 'completed',
    location: 'VetOnSpot Clinic — Koramangala',
    scheduledDate: demoIso(0),
    scheduledTime: '08:00',
    createdAt: 'Today',
    assignedDoctor: 'Dr. Sofia Kim',
    history: [
      { time: '08:00', label: 'Visit started', done: true },
      { time: '08:35', label: 'Visit completed', done: true },
    ],
  },
  {
    id: 'BK-D506',
    customerName: 'Ken Adams',
    petName: 'Hazel',
    petAge: '2 years',
    petIcon: 'rabbit',
    reason: 'Diet transition review',
    service: 'Online Consult',
    type: 'online',
    status: 'completed',
    location: 'Online',
    scheduledDate: demoIso(-5),
    scheduledTime: '10:00',
    createdAt: '5 days ago',
    assignedDoctor: 'Dr. Sofia Kim',
    history: [
      { time: '10:00', label: 'Consult started', done: true },
      { time: '10:25', label: 'Visit completed', done: true },
    ],
  },

  // ── Dr. Mark Ellis (DR-06) ─────────────────────────────────────────────
  {
    id: 'BK-D601',
    customerName: 'Anita Desai',
    petName: 'Buddy',
    petAge: '5 years',
    petIcon: 'dog',
    reason: 'Vaccination + deworming',
    service: 'Home Visit',
    type: 'home',
    status: 'sent',
    location: 'Koramangala 4th Block, Bangalore',
    area: 'Koramangala',
    scheduledDate: demoIso(0),
    scheduledTime: '12:15',
    createdAt: '30 min ago',
    requestedDoctorIds: ['DR-06'],
    history: [
      { time: '09:00', label: 'Booking created', done: true },
      { time: '09:12', label: 'Request sent to Dr. Mark Ellis', done: true },
    ],
  },
  {
    id: 'BK-D602',
    customerName: 'Steve Morgan',
    petName: 'Ginger',
    petAge: '8 years',
    petIcon: 'cat',
    reason: 'Senior wellness panel',
    service: 'Home Visit',
    type: 'home',
    status: 'sent',
    location: 'Ejipura, Bangalore',
    area: 'Koramangala',
    scheduledDate: demoIso(0),
    scheduledTime: '16:45',
    createdAt: '45 min ago',
    requestedDoctorIds: ['DR-06'],
    history: [
      { time: '08:40', label: 'Booking created', done: true },
      { time: '08:55', label: 'Request sent to Dr. Mark Ellis', done: true },
    ],
  },
  {
    id: 'BK-D603',
    customerName: 'Deepa Menon',
    petName: 'Charlie',
    petAge: '3 years',
    petIcon: 'dog',
    reason: 'Gastrointestinal upset',
    service: 'Home Visit',
    type: 'home',
    status: 'accepted',
    location: 'Koramangala 6th Block, Bangalore',
    area: 'Koramangala',
    scheduledDate: demoIso(0),
    scheduledTime: '13:00',
    createdAt: '2 hrs ago',
    assignedDoctor: 'Dr. Mark Ellis',
    history: [
      { time: '07:25', label: 'Booking created', done: true },
      { time: '07:45', label: 'Accepted by Dr. Mark Ellis', done: true },
    ],
  },
  {
    id: 'BK-D604',
    customerName: 'Ryan Cooper',
    petName: 'Molly',
    petAge: '4 years',
    petIcon: 'dog',
    reason: 'Microchip + annual vaccines',
    service: 'Clinic Visit',
    type: 'clinic',
    status: 'accepted',
    location: 'VetOnSpot Clinic — Koramangala',
    scheduledDate: demoIso(0),
    scheduledTime: '15:15',
    createdAt: '3 hrs ago',
    assignedDoctor: 'Dr. Mark Ellis',
    history: [
      { time: '07:00', label: 'Booking created', done: true },
      { time: '07:20', label: 'Accepted by Dr. Mark Ellis', done: true },
    ],
  },
  {
    id: 'BK-D605',
    customerName: 'Leah Fernandez',
    petName: 'Socks',
    petAge: '2 years',
    petIcon: 'cat',
    reason: 'Neuter recovery check',
    service: 'Home Visit',
    type: 'home',
    status: 'completed',
    location: 'Koramangala, Bangalore',
    area: 'Koramangala',
    scheduledDate: demoIso(0),
    scheduledTime: '09:15',
    createdAt: 'Today',
    assignedDoctor: 'Dr. Mark Ellis',
    history: [
      { time: '09:15', label: 'Visit started', done: true },
      { time: '09:50', label: 'Visit completed', done: true },
    ],
  },
  {
    id: 'BK-D606',
    customerName: 'George Allen',
    petName: 'Finn',
    petAge: '6 years',
    petIcon: 'dog',
    reason: 'Arthritis management review',
    service: 'Online Consult',
    type: 'online',
    status: 'completed',
    location: 'Online',
    scheduledDate: demoIso(-2),
    scheduledTime: '11:00',
    createdAt: '2 days ago',
    assignedDoctor: 'Dr. Mark Ellis',
    history: [
      { time: '11:00', label: 'Consult started', done: true },
      { time: '11:30', label: 'Visit completed', done: true },
    ],
  },
];

BOOKINGS.push(...DOCTOR_PROFILE_DEMO_BOOKINGS);

export const DOCTORS: Doctor[] = [
  {
    id: 'DR-01',
    name: 'Dr. Anita Rao',
    initials: 'AR',
    specialty: 'General Practice',
    status: 'on-visit',
    location: 'Marathahalli, Bangalore',
    area: 'Marathahalli',
    lat: 12.9591,
    lng: 77.6974,
    visitsToday: 6,
    rating: 4.9,
    distanceKm: 1.2,
    mapX: 72,
    mapY: 48,
  },
  {
    id: 'DR-02',
    name: 'Dr. Leo Martinez',
    initials: 'LM',
    specialty: 'Surgery',
    status: 'available',
    location: 'Whitefield, Bangalore',
    area: 'Whitefield',
    lat: 12.9698,
    lng: 77.7499,
    visitsToday: 4,
    rating: 4.8,
    distanceKm: 2.8,
    mapX: 88,
    mapY: 42,
  },
  {
    id: 'DR-03',
    name: 'Dr. Priya Nair',
    initials: 'PN',
    specialty: 'Dermatology',
    status: 'available',
    location: 'Indiranagar, Bangalore',
    area: 'Indiranagar',
    lat: 12.9784,
    lng: 77.6408,
    visitsToday: 5,
    rating: 4.7,
    distanceKm: 3.5,
    mapX: 52,
    mapY: 32,
  },
  {
    id: 'DR-04',
    name: 'Dr. Tom Hughes',
    initials: 'TH',
    specialty: 'Emergency Care',
    status: 'on-visit',
    location: 'HSR Layout, Bangalore',
    area: 'HSR Layout',
    lat: 12.9145,
    lng: 77.638,
    visitsToday: 7,
    rating: 4.6,
    distanceKm: 4.1,
    mapX: 48,
    mapY: 68,
  },
  {
    id: 'DR-05',
    name: 'Dr. Sofia Kim',
    initials: 'SK',
    specialty: 'Exotic Animals',
    status: 'offline',
    location: '—',
    visitsToday: 0,
    rating: 4.9,
  },
  {
    id: 'DR-06',
    name: 'Dr. Mark Ellis',
    initials: 'ME',
    specialty: 'General Practice',
    status: 'available',
    location: 'Koramangala, Bangalore',
    area: 'Koramangala',
    lat: 12.9352,
    lng: 77.6245,
    visitsToday: 3,
    rating: 4.5,
    distanceKm: 5.2,
    mapX: 38,
    mapY: 58,
  },
];

export const VEHICLES: Vehicle[] = [
  {
    id: 'VH-01',
    driver: 'Raj Patel',
    assignedDoctor: 'Dr. Anita Rao',
    status: 'on-trip',
    area: 'Marathahalli',
    lat: 12.957,
    lng: 77.692,
    ridesToday: 5,
    kmToday: 42,
    fuelPercent: 68,
  },
  {
    id: 'VH-02',
    driver: 'Lisa Wong',
    status: 'available',
    area: 'Indiranagar',
    lat: 12.976,
    lng: 77.635,
    ridesToday: 3,
    kmToday: 28,
    fuelPercent: 82,
  },
  {
    id: 'VH-03',
    driver: 'Carlos Diaz',
    assignedDoctor: 'Dr. Tom Hughes',
    status: 'on-trip',
    area: 'HSR Layout',
    lat: 12.913,
    lng: 77.641,
    ridesToday: 6,
    kmToday: 55,
    fuelPercent: 35,
  },
  {
    id: 'VH-04',
    status: 'maintenance',
    ridesToday: 0,
    kmToday: 0,
    fuelPercent: 90,
  },
  {
    id: 'VH-05',
    driver: 'Amy Foster',
    status: 'available',
    area: 'Koramangala',
    lat: 12.932,
    lng: 77.628,
    ridesToday: 2,
    kmToday: 18,
    fuelPercent: 55,
  },
  {
    id: 'VH-06',
    status: 'unavailable',
    ridesToday: 0,
    kmToday: 0,
    fuelPercent: 20,
  },
];

export const MAP_MARKERS: MapMarker[] = [
  { id: 'm1', type: 'doctor', x: 35, y: 45, label: 'Dr. Anita Rao', status: 'On visit' },
  { id: 'm2', type: 'doctor', x: 55, y: 30, label: 'Dr. Leo Martinez', status: 'Available' },
  { id: 'm3', type: 'doctor', x: 70, y: 55, label: 'Dr. Priya Nair', status: 'Available' },
  { id: 'm4', type: 'vehicle', x: 38, y: 48, label: 'VH-01', status: 'On trip' },
  { id: 'm5', type: 'vehicle', x: 60, y: 35, label: 'VH-02', status: 'Available' },
  { id: 'm6', type: 'customer', x: 42, y: 50, label: 'Sarah Mitchell — Max', status: 'Pending' },
  { id: 'm7', type: 'customer', x: 48, y: 38, label: 'Emily Rodriguez — Buddy', status: 'Accepted' },
];

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  accepted: 'Accepted',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const DOCTOR_STATUS_LABELS: Record<DoctorStatus, string> = {
  available: 'Available',
  'on-visit': 'On Visit',
  offline: 'Offline',
};

export function getStatusLabel(status: BookingStatus): string {
  return STATUS_LABELS[status];
}

export function getDoctorStatusLabel(status: DoctorStatus): string {
  return DOCTOR_STATUS_LABELS[status];
}

export function getFuelLevelClass(percent: number): 'high' | 'mid' | 'low' {
  if (percent >= 60) return 'high';
  if (percent >= 30) return 'mid';
  return 'low';
}

export function getBookingById(id: string): Booking | undefined {
  return BOOKINGS.find((b) => b.id === id);
}

export function isSamePet(a: Booking, b: Booking): boolean {
  return (
    a.petName.toLowerCase() === b.petName.toLowerCase() &&
    a.customerName.toLowerCase() === b.customerName.toLowerCase()
  );
}

export function getPetVisitHistory(booking: Booking): Booking[] {
  return BOOKINGS.filter((b) => isSamePet(b, booking)).sort((a, b) => {
    const byDate = b.scheduledDate.localeCompare(a.scheduledDate);
    if (byDate !== 0) return byDate;
    return b.scheduledTime.localeCompare(a.scheduledTime);
  });
}

export function getPreviousPetVisits(booking: Booking): Booking[] {
  return getPetVisitHistory(booking).filter(
    (b) =>
      b.id !== booking.id &&
      (b.status === 'completed' || b.status === 'cancelled' || b.scheduledDate < booking.scheduledDate),
  );
}

export interface PetMedicationRecord {
  bookingId: string;
  visitDate: string;
  medicine: string;
  dosage: string;
  doctor?: string;
  notes?: string;
}

export function getPetMedicationHistory(booking: Booking): PetMedicationRecord[] {
  const records: PetMedicationRecord[] = [];
  for (const visit of getPetVisitHistory(booking)) {
    const details = visit.details;
    if (!details) continue;
    if (details.medications.medicineName.trim()) {
      records.push({
        bookingId: visit.id,
        visitDate: visit.scheduledDate,
        medicine: details.medications.medicineName,
        dosage: details.medications.dosage,
        doctor: visit.assignedDoctor,
        notes: details.medications.sinceWhen || details.medications.supplements || undefined,
      });
    }
    if (details.doctorNotes.medicinesPrescribed.trim()) {
      records.push({
        bookingId: visit.id,
        visitDate: visit.scheduledDate,
        medicine: 'Prescribed',
        dosage: details.doctorNotes.medicinesPrescribed,
        doctor: visit.assignedDoctor,
        notes: details.doctorNotes.diagnosis || undefined,
      });
    }
    if (details.deworming.medicine.trim()) {
      records.push({
        bookingId: visit.id,
        visitDate: details.deworming.lastDate || visit.scheduledDate,
        medicine: details.deworming.medicine,
        dosage: 'Deworming',
        doctor: visit.assignedDoctor,
      });
    }
  }
  return records.sort((a, b) => b.visitDate.localeCompare(a.visitDate));
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

export function getBookingsForDoctor(doctor: Doctor): {
  active: Booking[];
  pending: Booking[];
  history: Booking[];
} {
  const mine = BOOKINGS.filter((b) => b.assignedDoctor === doctor.name);
  return {
    active: mine.filter((b) => b.status === 'accepted'),
    pending: mine.filter((b) => b.status === 'sent'),
    history: mine.filter((b) => b.status === 'completed' || b.status === 'cancelled'),
  };
}

export function getUnassignedBookings(): Booking[] {
  return sortBookingsByPriority(
    BOOKINGS.filter((b) => !b.assignedDoctor && ['pending', 'sent'].includes(b.status)),
  );
}

export function getDoctorById(id: string): Doctor | undefined {
  return DOCTORS.find((d) => d.id === id);
}

export function assignBookingToDoctor(booking: Booking, doctor: Doctor): void {
  booking.status = 'sent';
  booking.assignedDoctor = undefined;
  booking.requestedDoctorIds = [doctor.id];
  booking.history.push({
    time: 'Now',
    label: `Request sent to ${doctor.name}`,
    done: true,
  });
}

export function rejectBookingForDoctor(booking: Booking, doctor: Doctor): void {
  if (booking.requestedDoctorIds?.includes(doctor.id)) {
    booking.requestedDoctorIds = booking.requestedDoctorIds.filter((id) => id !== doctor.id);
  }
  if (booking.assignedDoctor === doctor.name && booking.status === 'sent') {
    booking.assignedDoctor = undefined;
  }
  if (!booking.requestedDoctorIds?.length) {
    booking.status = 'pending';
    booking.requestedDoctorIds = undefined;
  }
  booking.history.push({
    time: 'Now',
    label: `Declined by ${doctor.name}`,
    done: true,
  });
}

export function setDoctorAvailability(doctor: Doctor, available: boolean): void {
  if (!available) {
    doctor.status = 'offline';
    return;
  }
  const hasActiveVisit = BOOKINGS.some(
    (b) => b.assignedDoctor === doctor.name && b.status === 'accepted',
  );
  doctor.status = hasActiveVisit ? 'on-visit' : 'available';
}

export function getDoctorIncomingRequests(doctor: Doctor): Booking[] {
  return sortBookingsByPriority(
    BOOKINGS.filter((b) => {
      if (b.status !== 'sent') return false;
      if (b.requestedDoctorIds?.includes(doctor.id)) return true;
      return b.assignedDoctor === doctor.name;
    }),
  );
}

export function getDoctorTodayStats(doctor: Doctor): {
  total: number;
  pending: number;
  completed: number;
  active: number;
} {
  return getDoctorPeriodStats(doctor, 'today');
}

export type DoctorProfilePeriod = 'today' | 'yesterday' | 'weekly' | 'monthly';

function doctorPeriodTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function doctorPeriodYesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function isBookingInDoctorPeriod(booking: Booking, period: DoctorProfilePeriod): boolean {
  const date = booking.scheduledDate;
  if (period === 'today') {
    return date === doctorPeriodTodayIso();
  }
  if (period === 'yesterday') {
    return date === doctorPeriodYesterdayIso();
  }
  if (period === 'weekly') {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d >= start && d <= today;
  }
  if (period === 'monthly') {
    const now = new Date();
    const [y, m] = date.split('-').map(Number);
    return y === now.getFullYear() && m === now.getMonth() + 1;
  }
  return true;
}

export function getDoctorAssignedBookings(doctor: Doctor): Booking[] {
  return BOOKINGS.filter((b) => b.assignedDoctor === doctor.name);
}

export function getDoctorPeriodBookings(doctor: Doctor, period: DoctorProfilePeriod): Booking[] {
  return getDoctorAssignedBookings(doctor)
    .filter((b) => isBookingInDoctorPeriod(b, period))
    .sort((a, b) => {
      const dateCmp = b.scheduledDate.localeCompare(a.scheduledDate);
      if (dateCmp !== 0) return dateCmp;
      return b.scheduledTime.localeCompare(a.scheduledTime);
    });
}

export function getDoctorPeriodStats(
  doctor: Doctor,
  period: DoctorProfilePeriod,
): {
  total: number;
  pending: number;
  completed: number;
  active: number;
  patients: number;
} {
  const bookings = getDoctorPeriodBookings(doctor, period);
  const patients = new Set(bookings.map((b) => `${b.customerName}|${b.petName}`));
  return {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'accepted').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    active: bookings.filter((b) => b.status === 'accepted').length,
    patients: patients.size,
  };
}

export function getDoctorPendingTasks(doctor: Doctor, period: DoctorProfilePeriod): Booking[] {
  return getDoctorPeriodBookings(doctor, period).filter((b) => b.status === 'accepted');
}

export function getDoctorCompletedTasks(doctor: Doctor, period: DoctorProfilePeriod): Booking[] {
  return getDoctorPeriodBookings(doctor, period).filter((b) => b.status === 'completed');
}

export function getDoctorPeriodPatients(doctor: Doctor, period: DoctorProfilePeriod): number {
  return getDoctorPeriodStats(doctor, period).patients;
}

export function getDoctorAllHistory(doctor: Doctor): Booking[] {
  return BOOKINGS.filter(
    (b) =>
      b.assignedDoctor === doctor.name ||
      b.history.some((h) => h.label.includes(doctor.name)),
  ).sort((a, b) => {
    const dateCmp = b.scheduledDate.localeCompare(a.scheduledDate);
    if (dateCmp !== 0) return dateCmp;
    return b.scheduledTime.localeCompare(a.scheduledTime);
  });
}

export function getDoctorTotalPatients(doctor: Doctor): number {
  const names = new Set<string>();
  for (const b of getDoctorAllHistory(doctor)) {
    names.add(`${b.customerName}|${b.petName}`);
  }
  return names.size;
}

export function acceptBookingForDoctor(booking: Booking, doctor: Doctor, byAdmin = false): void {
  booking.assignedDoctor = doctor.name;
  booking.status = 'accepted';
  booking.requestedDoctorIds = undefined;
  if (doctor.status === 'available') {
    doctor.status = 'on-visit';
    doctor.visitsToday += 1;
  }
  booking.history.push({
    time: 'Now',
    label: byAdmin
      ? `Admin accepted on behalf of ${doctor.name}`
      : `Accepted by ${doctor.name}`,
    done: true,
  });
}

function speciesIcon(species: string): PetIcon {
  const map: Record<string, PetIcon> = {
    Dog: 'dog',
    Cat: 'cat',
    Bird: 'bird',
    Rabbit: 'rabbit',
    Others: 'paw',
  };
  return map[species] ?? 'paw';
}

function consultationToType(consultation: string): BookingType {
  if (consultation === 'Online Consultation') return 'online';
  if (consultation === 'Clinic Visit') return 'clinic';
  return 'home';
}

function generateBookingId(): string {
  const nums = BOOKINGS.map((b) => parseInt(b.id.replace('BK-', ''), 10)).filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 1040) + 1;
  return `BK-${next}`;
}

export function createBookingFromForm(form: PetAppointmentForm): Booking {
  const id = generateBookingId();
  const todayIso = new Date().toISOString().slice(0, 10);
  const isEmergency =
    form.appointment.bookingMode === 'emergency' ||
    form.emergency.isEmergency ||
    form.emergency.bleeding ||
    form.emergency.unconscious ||
    form.emergency.difficultyBreathing ||
    form.emergency.seizures ||
    form.emergency.poisonIngestion;

  const booking: Booking = {
    id,
    customerName: form.owner.fullName,
    petName: form.pet.name,
    petAge: form.pet.ageOrDob,
    petIcon: speciesIcon(form.pet.species),
    reason: form.appointment.reasonForVisit || form.health.mainComplaint,
    service: form.appointment.consultationType || (isEmergency ? 'Home Visit' : 'Home Visit'),
    type: consultationToType(form.appointment.consultationType || 'Home Visit'),
    status: 'pending',
    location: form.owner.address,
    scheduledDate: form.appointment.preferredDate || todayIso,
    scheduledTime: form.appointment.preferredTime || '09:00',
    submittedAt: new Date().toISOString(),
    createdAt: 'Just now',
    isEmergency,
    mustReachWithinMinutes: isEmergency ? 60 : undefined,
    assignedDoctor: form.appointment.doctorPreference || undefined,
    details: form,
    history: [{ time: 'Now', label: 'Booking created', done: true }],
  };

  BOOKINGS.unshift(booking);
  return booking;
}

export function updateBookingFromForm(id: string, form: PetAppointmentForm): void {
  const booking = BOOKINGS.find((b) => b.id === id);
  if (!booking) return;

  booking.customerName = form.owner.fullName;
  booking.petName = form.pet.name;
  booking.petAge = form.pet.ageOrDob;
  booking.petIcon = speciesIcon(form.pet.species);
  booking.reason = form.appointment.reasonForVisit || form.health.mainComplaint;
  booking.service = form.appointment.consultationType || booking.service;
  booking.type = consultationToType(form.appointment.consultationType);
  booking.location = form.owner.address;
  booking.scheduledDate = form.appointment.preferredDate || booking.scheduledDate;
  booking.scheduledTime = form.appointment.preferredTime || booking.scheduledTime;
  booking.assignedDoctor = form.appointment.doctorPreference || booking.assignedDoctor;
  booking.details = form;
  booking.isEmergency =
    form.appointment.bookingMode === 'emergency' ||
    form.emergency.isEmergency ||
    form.emergency.bleeding ||
    form.emergency.unconscious ||
    form.emergency.difficultyBreathing ||
    form.emergency.seizures ||
    form.emergency.poisonIngestion;
  booking.mustReachWithinMinutes = booking.isEmergency ? 60 : undefined;
}

export const DOCTOR_SPECIALTIES = [
  'General Practice',
  'Surgery',
  'Dermatology',
  'Emergency Care',
  'Exotic Animals',
  'Cardiology',
  'Orthopedics',
];

export interface DoctorForm {
  name: string;
  specialty: string;
  location: string;
  mobile: string;
  email: string;
  rating: number;
  status: DoctorStatus;
}

export function createEmptyDoctorForm(): DoctorForm {
  return { name: '', specialty: '', location: '', mobile: '', email: '', rating: 4.5, status: 'available' };
}

function doctorInitials(name: string): string {
  return name
    .replace(/^Dr\.\s*/i, '')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function generateDoctorId(): string {
  const nums = DOCTORS.map((d) => parseInt(d.id.replace('DR-', ''), 10)).filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `DR-${next.toString().padStart(2, '0')}`;
}

export function createDoctorFromForm(form: DoctorForm): Doctor {
  const doctor: Doctor = {
    id: generateDoctorId(),
    name: form.name.trim().startsWith('Dr.') ? form.name.trim() : `Dr. ${form.name.trim()}`,
    initials: doctorInitials(form.name),
    specialty: form.specialty,
    status: 'available',
    location: form.location.trim(),
    visitsToday: 0,
    rating: form.rating || 4.5,
    distanceKm: 3,
    mapX: 50,
    mapY: 50,
  };
  DOCTORS.unshift(doctor);
  return doctor;
}