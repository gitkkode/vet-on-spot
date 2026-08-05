import type { IconName } from '../components/icon/icon.types';

export type PetSpecies = 'Dog' | 'Cat' | 'Bird' | 'Rabbit' | 'Others';
export type ConsultationType = 'Clinic Visit' | 'Home Visit' | 'Online Consultation';
export type BookingMode = 'emergency' | 'normal';
export type SeverityLevel = 'Mild' | 'Moderate' | 'Severe';
export type AppetiteLevel = 'Normal' | 'Reduced' | 'Not Eating';
export type YesNo = 'Yes' | 'No';
export type FoodType = 'Homemade' | 'Dry Food' | 'Wet Food' | 'Mixed';

export interface PetAppointmentForm {
  owner: {
    fullName: string;
    mobile: string;
    email: string;
    address: string;
    emergencyContact: string;
  };
  pet: {
    name: string;
    species: PetSpecies | '';
    breed: string;
    gender: string;
    ageOrDob: string;
    weight: string;
    colorMarks: string;
    microchip: string;
    neutered: YesNo | '';
  };
  appointment: {
    bookingMode: BookingMode;
    preferredDate: string;
    preferredTime: string;
    consultationType: ConsultationType | '';
    doctorPreference: string;
    reasonForVisit: string;
    additionalNotes: string;
  };
  health: {
    mainComplaint: string;
    symptoms: string;
    sinceWhen: string;
    severity: SeverityLevel | '';
    appetite: AppetiteLevel | '';
    waterIntake: string;
    urinationNormal: YesNo | '';
    stoolNormal: YesNo | '';
    vomiting: boolean;
    diarrhea: boolean;
    fever: boolean;
    coughing: boolean;
    sneezing: boolean;
    difficultyWalking: boolean;
    breathingDifficulty: boolean;
    painArea: string;
    injuryAccident: string;
    problemMediaFiles: string[];
  };
  pastMedical: {
    previousIllnesses: string;
    previousSurgeries: string;
    previousHospitalization: string;
    chronicDiseases: string[];
  };
  vaccination: {
    vaccinated: YesNo | '';
    lastVaccinationDate: string;
    vaccineNames: string;
    vaccinationCardFiles: string[];
  };
  deworming: {
    lastDate: string;
    medicine: string;
  };
  tickFlea: {
    lastTreatmentDate: string;
    productUsed: string;
  };
  medications: {
    medicineName: string;
    dosage: string;
    sinceWhen: string;
    supplements: string;
  };
  allergies: {
    medicine: string;
    food: string;
    environmental: string;
  };
  diet: {
    foodType: FoodType | '';
    brandName: string;
    feedingFrequency: string;
    treatsGiven: string;
  };
  lifestyle: {
    indoorOutdoor: string;
    exerciseLevel: string;
    contactOtherAnimals: string;
    recentTravel: string;
    tickExposure: string;
  };
  reproductive: {
    pregnant: YesNo | '';
    lastHeatCycle: string;
    breedingHistory: string;
    numberOfLitters: string;
  };
  emergency: {
    isEmergency: boolean;
    bleeding: boolean;
    poisonIngestion: boolean;
    seizures: boolean;
    unconscious: boolean;
    difficultyBreathing: boolean;
  };
  documents: {
    prescriptions: string[];
    bloodTests: string[];
    xray: string[];
    ultrasound: string[];
    vaccinationCard: string[];
    medicalRecords: string[];
    problemPhotos: string[];
  };
  doctorNotes: {
    diagnosis: string;
    clinicalFindings: string;
    treatmentPlan: string;
    medicinesPrescribed: string;
    labTestsRecommended: string;
    followUpDate: string;
    nextVaccinationDate: string;
    nextDewormingDate: string;
  };
}

export const CHRONIC_DISEASE_OPTIONS = [
  'Diabetes',
  'Kidney Disease',
  'Heart Disease',
  'Liver Disease',
  'Arthritis',
  'Previous Fractures',
  'Skin Problems',
  'Ear Problems',
] as const;

export const DOG_BREEDS = [
  'Labrador Retriever',
  'German Shepherd',
  'Golden Retriever',
  'Bulldog',
  'Beagle',
  'Poodle',
  'Rottweiler',
  'Yorkshire Terrier',
  'Dachshund',
  'Siberian Husky',
  'Shih Tzu',
  'Boxer',
  'Great Dane',
  'Doberman',
  'Maltese',
  'Indie / Mixed Breed',
  'Other',
] as const;

export const CAT_BREEDS = [
  'Persian',
  'Maine Coon',
  'Siamese',
  'Ragdoll',
  'Bengal',
  'British Shorthair',
  'Himalayan',
  'Scottish Fold',
  'Sphynx',
  'Bombay',
  'Russian Blue',
  'American Shorthair',
  'Indie / Mixed Breed',
  'Other',
] as const;

export function createEmptyAppointmentForm(): PetAppointmentForm {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return {
    owner: { fullName: '', mobile: '', email: '', address: '', emergencyContact: '' },
    pet: {
      name: '',
      species: '',
      breed: '',
      gender: '',
      ageOrDob: '',
      weight: '',
      colorMarks: '',
      microchip: '',
      neutered: '',
    },
    appointment: {
      bookingMode: 'normal',
      preferredDate: todayIso,
      preferredTime: '',
      consultationType: '',
      doctorPreference: '',
      reasonForVisit: '',
      additionalNotes: '',
    },
    health: {
      mainComplaint: '',
      symptoms: '',
      sinceWhen: '',
      severity: '',
      appetite: '',
      waterIntake: '',
      urinationNormal: '',
      stoolNormal: '',
      vomiting: false,
      diarrhea: false,
      fever: false,
      coughing: false,
      sneezing: false,
      difficultyWalking: false,
      breathingDifficulty: false,
      painArea: '',
      injuryAccident: '',
      problemMediaFiles: [],
    },
    pastMedical: {
      previousIllnesses: '',
      previousSurgeries: '',
      previousHospitalization: '',
      chronicDiseases: [],
    },
    vaccination: {
      vaccinated: '',
      lastVaccinationDate: '',
      vaccineNames: '',
      vaccinationCardFiles: [],
    },
    deworming: { lastDate: '', medicine: '' },
    tickFlea: { lastTreatmentDate: '', productUsed: '' },
    medications: { medicineName: '', dosage: '', sinceWhen: '', supplements: '' },
    allergies: { medicine: '', food: '', environmental: '' },
    diet: { foodType: '', brandName: '', feedingFrequency: '', treatsGiven: '' },
    lifestyle: {
      indoorOutdoor: '',
      exerciseLevel: '',
      contactOtherAnimals: '',
      recentTravel: '',
      tickExposure: '',
    },
    reproductive: {
      pregnant: '',
      lastHeatCycle: '',
      breedingHistory: '',
      numberOfLitters: '',
    },
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
      bloodTests: [],
      xray: [],
      ultrasound: [],
      vaccinationCard: [],
      medicalRecords: [],
      problemPhotos: [],
    },
    doctorNotes: {
      diagnosis: '',
      clinicalFindings: '',
      treatmentPlan: '',
      medicinesPrescribed: '',
      labTestsRecommended: '',
      followUpDate: '',
      nextVaccinationDate: '',
      nextDewormingDate: '',
    },
  };
}

export function validateAppointmentForm(form: PetAppointmentForm): string[] {
  if (form.appointment.bookingMode === 'emergency') {
    return validateEmergencyAppointmentForm(form);
  }
  const errors: string[] = [];
  if (!form.owner.fullName.trim()) errors.push('Owner full name is required');
  if (!form.owner.mobile.trim()) errors.push('Owner mobile number is required');
  if (!form.owner.address.trim()) errors.push('Owner address is required');
  if (!form.pet.breed.trim()) errors.push('Pet breed is required');
  if (!form.pet.ageOrDob.trim()) errors.push('Pet age or date of birth is required');
  if (!form.appointment.consultationType) errors.push('Consultation type is required');
  if (!form.appointment.reasonForVisit.trim()) errors.push('Reason for visit is required');
  return errors;
}

export function validateEmergencyAppointmentForm(form: PetAppointmentForm): string[] {
  const errors: string[] = [];
  if (!form.owner.fullName.trim()) errors.push('Owner name is required');
  if (!form.owner.mobile.trim()) errors.push('Mobile number is required');
  if (!form.owner.address.trim()) errors.push('Address is required');
  if (!form.pet.name.trim()) errors.push('Pet name is required');
  if (!form.pet.species) errors.push('Species is required');
  if (!form.appointment.preferredDate.trim()) errors.push('Preferred date is required');
  if (!form.appointment.preferredTime.trim()) errors.push('Preferred time is required');
  if (!form.appointment.reasonForVisit.trim()) errors.push('Reason for visit is required');
  return errors;
}

export type AppointmentSectionId =
  | 'owner'
  | 'pet'
  | 'appointment'
  | 'health'
  | 'pastMedical'
  | 'vaccination'
  | 'deworming'
  | 'tickFlea'
  | 'medications'
  | 'allergies'
  | 'diet'
  | 'lifestyle'
  | 'reproductive'
  | 'emergency'
  | 'documents'
  | 'doctorNotes';

export type SectionStatus = 'complete' | 'partial' | 'empty';
export type SectionDotStatus = 'error' | 'complete' | 'pending';

export interface AppointmentSectionMeta {
  id: AppointmentSectionId;
  number: number;
  title: string;
  tag: string;
  mandatory: boolean;
  icon: IconName;
}

export const APPOINTMENT_SECTIONS: AppointmentSectionMeta[] = [
  { id: 'owner', number: 1, title: 'Pet Owner Details', tag: 'Required to book', mandatory: true, icon: 'user' },
  { id: 'pet', number: 2, title: 'Pet Details', tag: 'Required to book', mandatory: true, icon: 'paw' },
  { id: 'appointment', number: 3, title: 'Appointment Details', tag: 'Required to book', mandatory: true, icon: 'calendar' },
  { id: 'health', number: 4, title: 'Current Health Problem', tag: 'Required to book', mandatory: true, icon: 'stethoscope' },
  { id: 'pastMedical', number: 5, title: 'Past Medical History', tag: 'Recommended', mandatory: false, icon: 'clipboard' },
  { id: 'vaccination', number: 6, title: 'Vaccination History', tag: 'Recommended', mandatory: false, icon: 'syringe' },
  { id: 'deworming', number: 7, title: 'Deworming History', tag: 'Optional', mandatory: false, icon: 'pill' },
  { id: 'tickFlea', number: 8, title: 'Tick / Flea Prevention', tag: 'Optional', mandatory: false, icon: 'bug' },
  { id: 'medications', number: 9, title: 'Current Medications', tag: 'Recommended', mandatory: false, icon: 'pill' },
  { id: 'allergies', number: 10, title: 'Allergies', tag: 'Recommended', mandatory: false, icon: 'warning' },
  { id: 'diet', number: 11, title: 'Diet Information', tag: 'Optional', mandatory: false, icon: 'utensils' },
  { id: 'lifestyle', number: 12, title: 'Lifestyle', tag: 'Optional', mandatory: false, icon: 'home' },
  { id: 'reproductive', number: 13, title: 'Reproductive History', tag: 'If Applicable', mandatory: false, icon: 'heart' },
  { id: 'emergency', number: 14, title: 'Emergency Questions', tag: 'Important', mandatory: false, icon: 'alert' },
  { id: 'documents', number: 15, title: 'Documents to Upload', tag: 'Recommended', mandatory: false, icon: 'paperclip' },
  { id: 'doctorNotes', number: 16, title: 'Doctor Notes', tag: 'Internal Only', mandatory: false, icon: 'file-text' },
];

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function hasArray(value: unknown[] | undefined): boolean {
  return Boolean(value && value.length > 0);
}

function hasEmergencyFlags(emergency: PetAppointmentForm['emergency']): boolean {
  return Object.values(emergency).some(Boolean);
}

function hasDocuments(documents: PetAppointmentForm['documents']): boolean {
  return Object.values(documents).some((files) => files.length > 0);
}

export function getSectionStatus(form: PetAppointmentForm, sectionId: AppointmentSectionId): SectionStatus {
  switch (sectionId) {
    case 'owner': {
      const required = [form.owner.fullName, form.owner.mobile, form.owner.address, form.owner.emergencyContact];
      const optional = [form.owner.email];
      const reqFilled = required.filter(hasText).length;
      const optFilled = optional.filter(hasText).length;
      if (reqFilled === required.length) return 'complete';
      if (reqFilled > 0 || optFilled > 0) return 'partial';
      return 'empty';
    }
    case 'pet': {
      const required = [form.pet.name, form.pet.species, form.pet.breed, form.pet.gender, form.pet.ageOrDob, form.pet.weight];
      const optional = [form.pet.colorMarks, form.pet.microchip, form.pet.neutered];
      const reqFilled = required.filter((v) => (typeof v === 'string' ? hasText(v) : Boolean(v))).length;
      const optFilled = optional.filter((v) => (typeof v === 'string' ? hasText(v) : Boolean(v))).length;
      if (reqFilled === required.length) return 'complete';
      if (reqFilled > 0 || optFilled > 0) return 'partial';
      return 'empty';
    }
    case 'appointment': {
      const required = [
        form.appointment.preferredDate,
        form.appointment.preferredTime,
        form.appointment.consultationType,
        form.appointment.reasonForVisit,
      ];
      const reqFilled = required.filter((v) => (typeof v === 'string' ? hasText(v) : Boolean(v))).length;
      if (reqFilled === required.length) return 'complete';
      if (reqFilled > 0 || hasText(form.appointment.doctorPreference)) return 'partial';
      return 'empty';
    }
    case 'health': {
      const required = [form.health.mainComplaint, form.health.symptoms, form.health.sinceWhen, form.health.severity];
      const reqFilled = required.filter((v) => (typeof v === 'string' ? hasText(v) : Boolean(v))).length;
      const hasExtra =
        hasText(form.health.appetite) ||
        hasText(form.health.waterIntake) ||
        hasText(form.health.urinationNormal) ||
        hasText(form.health.stoolNormal) ||
        hasText(form.health.painArea) ||
        hasText(form.health.injuryAccident) ||
        hasArray(form.health.problemMediaFiles) ||
        Object.entries(form.health).some(([k, v]) => typeof v === 'boolean' && v && k !== 'problemMediaFiles');
      if (reqFilled === required.length) return 'complete';
      if (reqFilled > 0 || hasExtra) return 'partial';
      return 'empty';
    }
    case 'pastMedical':
      if (
        hasText(form.pastMedical.previousIllnesses) ||
        hasText(form.pastMedical.previousSurgeries) ||
        hasText(form.pastMedical.previousHospitalization) ||
        hasArray(form.pastMedical.chronicDiseases)
      ) {
        return 'complete';
      }
      return 'empty';
    case 'vaccination':
      if (
        hasText(form.vaccination.vaccinated) ||
        hasText(form.vaccination.lastVaccinationDate) ||
        hasText(form.vaccination.vaccineNames) ||
        hasArray(form.vaccination.vaccinationCardFiles)
      ) {
        return 'complete';
      }
      return 'empty';
    case 'deworming':
      return hasText(form.deworming.lastDate) || hasText(form.deworming.medicine) ? 'complete' : 'empty';
    case 'tickFlea':
      return hasText(form.tickFlea.lastTreatmentDate) || hasText(form.tickFlea.productUsed) ? 'complete' : 'empty';
    case 'medications':
      return (
        hasText(form.medications.medicineName) ||
        hasText(form.medications.dosage) ||
        hasText(form.medications.sinceWhen) ||
        hasText(form.medications.supplements)
      )
        ? 'complete'
        : 'empty';
    case 'allergies':
      return (
        hasText(form.allergies.medicine) ||
        hasText(form.allergies.food) ||
        hasText(form.allergies.environmental)
      )
        ? 'complete'
        : 'empty';
    case 'diet':
      return (
        hasText(form.diet.foodType) ||
        hasText(form.diet.brandName) ||
        hasText(form.diet.feedingFrequency) ||
        hasText(form.diet.treatsGiven)
      )
        ? 'complete'
        : 'empty';
    case 'lifestyle':
      return Object.values(form.lifestyle).some(hasText) ? 'complete' : 'empty';
    case 'reproductive':
      return Object.values(form.reproductive).some((v) => hasText(v)) ? 'complete' : 'empty';
    case 'emergency':
      return hasEmergencyFlags(form.emergency) ? 'complete' : 'empty';
    case 'documents':
      return hasDocuments(form.documents) ? 'complete' : 'empty';
    case 'doctorNotes':
      return Object.values(form.doctorNotes).some(hasText) ? 'complete' : 'empty';
    default:
      return 'empty';
  }
}

export function getSectionSummary(form: PetAppointmentForm, sectionId: AppointmentSectionId): string {
  switch (sectionId) {
    case 'owner':
      if (!hasText(form.owner.fullName)) return 'Tap to add owner details';
      return `${form.owner.fullName}${form.owner.mobile ? ' · ' + form.owner.mobile : ''}`;
    case 'pet':
      if (!hasText(form.pet.name)) return 'Tap to add pet details';
      return `${form.pet.name}${form.pet.species ? ' · ' + form.pet.species : ''}${form.pet.breed ? ' · ' + form.pet.breed : ''}`;
    case 'appointment':
      if (!form.appointment.preferredDate) return 'Tap to schedule appointment';
      return `${form.appointment.preferredDate}${form.appointment.preferredTime ? ' at ' + form.appointment.preferredTime : ''}${form.appointment.consultationType ? ' · ' + form.appointment.consultationType : ''}`;
    case 'health':
      if (!hasText(form.health.mainComplaint)) return 'Tap to describe health problem';
      return form.health.mainComplaint;
    default: {
      const status = getSectionStatus(form, sectionId);
      if (status === 'complete') return 'Details added';
      return 'Not filled yet — tap to add';
    }
  }
}

export function getUnfilledDetailReminders(form: PetAppointmentForm): string[] {
  const reminders: string[] = [];

  if (!hasText(form.owner.email)) reminders.push('Owner email');
  if (!hasText(form.pet.colorMarks)) reminders.push('Pet color / identification marks');
  if (!hasText(form.pet.microchip)) reminders.push('Microchip number');
  if (!form.pet.neutered) reminders.push('Neutered / spayed status');
  if (!hasText(form.appointment.doctorPreference)) reminders.push('Doctor preference');
  if (!hasText(form.health.appetite)) reminders.push('Appetite');
  if (!hasText(form.health.waterIntake)) reminders.push('Water intake');
  if (!hasText(form.health.urinationNormal)) reminders.push('Urination status');
  if (!hasText(form.health.stoolNormal)) reminders.push('Stool status');
  if (!hasArray(form.health.problemMediaFiles)) reminders.push('Problem photos / videos');

  const optionalSections: { id: AppointmentSectionId; label: string }[] = [
    { id: 'pastMedical', label: 'Past medical history' },
    { id: 'vaccination', label: 'Vaccination history' },
    { id: 'deworming', label: 'Deworming history' },
    { id: 'tickFlea', label: 'Tick / flea prevention' },
    { id: 'medications', label: 'Current medications' },
    { id: 'allergies', label: 'Allergies' },
    { id: 'diet', label: 'Diet information' },
    { id: 'lifestyle', label: 'Lifestyle details' },
    { id: 'reproductive', label: 'Reproductive history' },
    { id: 'emergency', label: 'Emergency screening questions' },
    { id: 'documents', label: 'Uploaded documents' },
    { id: 'doctorNotes', label: 'Doctor notes (internal)' },
  ];

  for (const section of optionalSections) {
    if (getSectionStatus(form, section.id) === 'empty') {
      reminders.push(section.label);
    }
  }

  return reminders;
}

export function getMandatorySectionsWithIssues(form: PetAppointmentForm): AppointmentSectionMeta[] {
  return APPOINTMENT_SECTIONS.filter(
    (s) => s.mandatory && getSectionStatus(form, s.id) !== 'complete',
  );
}

export function getSectionDotStatus(
  form: PetAppointmentForm,
  sectionId: AppointmentSectionId,
): SectionDotStatus {
  const section = APPOINTMENT_SECTIONS.find((s) => s.id === sectionId);
  const status = getSectionStatus(form, sectionId);
  if (section?.mandatory && status !== 'complete') return 'error';
  if (status === 'complete') return 'complete';
  return 'pending';
}

export interface FilledDetailGroup {
  section: string;
  items: { label: string; value: string }[];
}

function pushIf(items: { label: string; value: string }[], label: string, value: string | undefined): void {
  if (hasText(value)) items.push({ label, value: value!.trim() });
}

export function getFilledFormDetails(form: PetAppointmentForm): FilledDetailGroup[] {
  const groups: FilledDetailGroup[] = [];

  const owner: { label: string; value: string }[] = [];
  pushIf(owner, 'Full Name', form.owner.fullName);
  pushIf(owner, 'Mobile', form.owner.mobile);
  pushIf(owner, 'Email', form.owner.email);
  pushIf(owner, 'Address', form.owner.address);
  pushIf(owner, 'Emergency Contact', form.owner.emergencyContact);
  if (owner.length) groups.push({ section: 'Pet Owner Details', items: owner });

  const pet: { label: string; value: string }[] = [];
  pushIf(pet, 'Pet Name', form.pet.name);
  pushIf(pet, 'Species', form.pet.species);
  pushIf(pet, 'Breed', form.pet.breed);
  pushIf(pet, 'Gender', form.pet.gender);
  pushIf(pet, 'Age / DOB', form.pet.ageOrDob);
  pushIf(pet, 'Weight', form.pet.weight);
  pushIf(pet, 'Color / Marks', form.pet.colorMarks);
  pushIf(pet, 'Microchip', form.pet.microchip);
  if (form.pet.neutered) pet.push({ label: 'Neutered / Spayed', value: form.pet.neutered });
  if (pet.length) groups.push({ section: 'Pet Details', items: pet });

  const appt: { label: string; value: string }[] = [];
  pushIf(appt, 'Date', form.appointment.preferredDate);
  pushIf(appt, 'Time', form.appointment.preferredTime);
  pushIf(appt, 'Consultation Type', form.appointment.consultationType);
  pushIf(appt, 'Doctor Preference', form.appointment.doctorPreference);
  pushIf(appt, 'Reason for Visit', form.appointment.reasonForVisit);
  pushIf(appt, 'Additional Notes', form.appointment.additionalNotes);
  if (appt.length) groups.push({ section: 'Appointment Details', items: appt });

  const health: { label: string; value: string }[] = [];
  pushIf(health, 'Main Complaint', form.health.mainComplaint);
  pushIf(health, 'Symptoms', form.health.symptoms);
  pushIf(health, 'Since When', form.health.sinceWhen);
  pushIf(health, 'Severity', form.health.severity);
  pushIf(health, 'Appetite', form.health.appetite);
  pushIf(health, 'Water Intake', form.health.waterIntake);
  if (form.health.urinationNormal) health.push({ label: 'Urination Normal', value: form.health.urinationNormal });
  if (form.health.stoolNormal) health.push({ label: 'Stool Normal', value: form.health.stoolNormal });
  pushIf(health, 'Pain Area', form.health.painArea);
  pushIf(health, 'Injury / Accident', form.health.injuryAccident);
  const symptoms = [
    form.health.vomiting && 'Vomiting',
    form.health.diarrhea && 'Diarrhea',
    form.health.fever && 'Fever',
    form.health.coughing && 'Coughing',
    form.health.sneezing && 'Sneezing',
    form.health.difficultyWalking && 'Difficulty Walking',
    form.health.breathingDifficulty && 'Breathing Difficulty',
  ].filter(Boolean) as string[];
  if (symptoms.length) health.push({ label: 'Symptoms Checked', value: symptoms.join(', ') });
  if (form.health.problemMediaFiles.length) {
    health.push({ label: 'Photos / Videos', value: form.health.problemMediaFiles.join(', ') });
  }
  if (health.length) groups.push({ section: 'Current Health Problem', items: health });

  const past: { label: string; value: string }[] = [];
  pushIf(past, 'Previous Illnesses', form.pastMedical.previousIllnesses);
  pushIf(past, 'Previous Surgeries', form.pastMedical.previousSurgeries);
  pushIf(past, 'Previous Hospitalization', form.pastMedical.previousHospitalization);
  if (form.pastMedical.chronicDiseases.length) {
    past.push({ label: 'Chronic Diseases', value: form.pastMedical.chronicDiseases.join(', ') });
  }
  if (past.length) groups.push({ section: 'Past Medical History', items: past });

  const vacc: { label: string; value: string }[] = [];
  if (form.vaccination.vaccinated) vacc.push({ label: 'Vaccinated', value: form.vaccination.vaccinated });
  pushIf(vacc, 'Last Vaccination Date', form.vaccination.lastVaccinationDate);
  pushIf(vacc, 'Vaccine Names', form.vaccination.vaccineNames);
  if (form.vaccination.vaccinationCardFiles.length) {
    vacc.push({ label: 'Vaccination Card', value: form.vaccination.vaccinationCardFiles.join(', ') });
  }
  if (vacc.length) groups.push({ section: 'Vaccination History', items: vacc });

  const deworm: { label: string; value: string }[] = [];
  pushIf(deworm, 'Last Deworming Date', form.deworming.lastDate);
  pushIf(deworm, 'Medicine', form.deworming.medicine);
  if (deworm.length) groups.push({ section: 'Deworming History', items: deworm });

  const tick: { label: string; value: string }[] = [];
  pushIf(tick, 'Last Treatment Date', form.tickFlea.lastTreatmentDate);
  pushIf(tick, 'Product Used', form.tickFlea.productUsed);
  if (tick.length) groups.push({ section: 'Tick / Flea Prevention', items: tick });

  const meds: { label: string; value: string }[] = [];
  pushIf(meds, 'Medicine Name', form.medications.medicineName);
  pushIf(meds, 'Dosage', form.medications.dosage);
  pushIf(meds, 'Since When', form.medications.sinceWhen);
  pushIf(meds, 'Supplements', form.medications.supplements);
  if (meds.length) groups.push({ section: 'Current Medications', items: meds });

  const allergy: { label: string; value: string }[] = [];
  pushIf(allergy, 'Medicine Allergies', form.allergies.medicine);
  pushIf(allergy, 'Food Allergies', form.allergies.food);
  pushIf(allergy, 'Environmental Allergies', form.allergies.environmental);
  if (allergy.length) groups.push({ section: 'Allergies', items: allergy });

  const diet: { label: string; value: string }[] = [];
  pushIf(diet, 'Food Type', form.diet.foodType);
  pushIf(diet, 'Brand Name', form.diet.brandName);
  pushIf(diet, 'Feeding Frequency', form.diet.feedingFrequency);
  pushIf(diet, 'Treats Given', form.diet.treatsGiven);
  if (diet.length) groups.push({ section: 'Diet Information', items: diet });

  const life: { label: string; value: string }[] = [];
  pushIf(life, 'Indoor / Outdoor', form.lifestyle.indoorOutdoor);
  pushIf(life, 'Exercise Level', form.lifestyle.exerciseLevel);
  pushIf(life, 'Contact with Other Animals', form.lifestyle.contactOtherAnimals);
  pushIf(life, 'Recent Travel', form.lifestyle.recentTravel);
  pushIf(life, 'Exposure to Ticks', form.lifestyle.tickExposure);
  if (life.length) groups.push({ section: 'Lifestyle', items: life });

  const repro: { label: string; value: string }[] = [];
  if (form.reproductive.pregnant) repro.push({ label: 'Pregnant', value: form.reproductive.pregnant });
  pushIf(repro, 'Last Heat Cycle', form.reproductive.lastHeatCycle);
  pushIf(repro, 'Breeding History', form.reproductive.breedingHistory);
  pushIf(repro, 'Number of Litters', form.reproductive.numberOfLitters);
  if (repro.length) groups.push({ section: 'Reproductive History', items: repro });

  const emerg: { label: string; value: string }[] = [];
  if (form.emergency.isEmergency) emerg.push({ label: 'Emergency', value: 'Yes' });
  if (form.emergency.bleeding) emerg.push({ label: 'Bleeding', value: 'Yes' });
  if (form.emergency.poisonIngestion) emerg.push({ label: 'Poison Ingestion', value: 'Yes' });
  if (form.emergency.seizures) emerg.push({ label: 'Seizures', value: 'Yes' });
  if (form.emergency.unconscious) emerg.push({ label: 'Unconscious', value: 'Yes' });
  if (form.emergency.difficultyBreathing) emerg.push({ label: 'Difficulty Breathing', value: 'Yes' });
  if (emerg.length) groups.push({ section: 'Emergency Questions', items: emerg });

  const docs: { label: string; value: string }[] = [];
  const docLabels: Record<keyof PetAppointmentForm['documents'], string> = {
    prescriptions: 'Previous Prescriptions',
    bloodTests: 'Blood Test Reports',
    xray: 'X-ray Reports',
    ultrasound: 'Ultrasound Reports',
    vaccinationCard: 'Vaccination Card',
    medicalRecords: 'Medical Records',
    problemPhotos: 'Problem Photos / Videos',
  };
  for (const [key, label] of Object.entries(docLabels) as [keyof PetAppointmentForm['documents'], string][]) {
    if (form.documents[key].length) docs.push({ label, value: form.documents[key].join(', ') });
  }
  if (docs.length) groups.push({ section: 'Documents', items: docs });

  const notes: { label: string; value: string }[] = [];
  pushIf(notes, 'Diagnosis', form.doctorNotes.diagnosis);
  pushIf(notes, 'Clinical Findings', form.doctorNotes.clinicalFindings);
  pushIf(notes, 'Treatment Plan', form.doctorNotes.treatmentPlan);
  pushIf(notes, 'Medicines Prescribed', form.doctorNotes.medicinesPrescribed);
  pushIf(notes, 'Lab Tests Recommended', form.doctorNotes.labTestsRecommended);
  pushIf(notes, 'Follow-up Date', form.doctorNotes.followUpDate);
  pushIf(notes, 'Next Vaccination Date', form.doctorNotes.nextVaccinationDate);
  pushIf(notes, 'Next Deworming Date', form.doctorNotes.nextDewormingDate);
  if (notes.length) groups.push({ section: 'Doctor Notes', items: notes });

  return groups;
}

export function bookingToForm(booking: import('./booking.model').Booking): PetAppointmentForm {
  const empty = createEmptyAppointmentForm();
  if (booking.details) {
    const cloned = structuredClone(booking.details);
    if (!cloned.appointment.bookingMode) {
      cloned.appointment.bookingMode = booking.isEmergency ? 'emergency' : 'normal';
    }
    if (cloned.appointment.additionalNotes === undefined) {
      cloned.appointment.additionalNotes = '';
    }
    if (cloned.appointment.bookingMode === 'emergency') {
      cloned.emergency.isEmergency = true;
    }
    return cloned;
  }
  empty.owner.fullName = booking.customerName;
  empty.owner.address = booking.location;
  empty.pet.name = booking.petName;
  empty.pet.ageOrDob = booking.petAge;
  empty.appointment.preferredDate = booking.scheduledDate;
  empty.appointment.preferredTime = booking.scheduledTime;
  empty.appointment.bookingMode = booking.isEmergency ? 'emergency' : 'normal';
  empty.appointment.consultationType =
    booking.type === 'online'
      ? 'Online Consultation'
      : booking.type === 'clinic'
        ? 'Clinic Visit'
        : 'Home Visit';
  empty.appointment.reasonForVisit = booking.reason;
  empty.health.mainComplaint = booking.reason;
  if (booking.isEmergency) {
    empty.emergency.isEmergency = true;
    if (!empty.appointment.consultationType) {
      empty.appointment.consultationType = 'Home Visit';
    }
  }
  return empty;
}
