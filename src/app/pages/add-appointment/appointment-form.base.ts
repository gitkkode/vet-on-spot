import { Directive, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '../../services/appointment.service';
import { DoctorApiService } from '../../services/doctor-api.service';
import { IconName } from '../../components/icon/icon.types';
import { Doctor } from '../../models/doctor.model';
import {
  APPETITE_OPTIONS,
  breedOptions,
  doctorPickerOptions,
  FOOD_TYPE_OPTIONS,
  GENDER_OPTIONS,
  SEVERITY_OPTIONS,
  SPECIES_OPTIONS,
  TIME_OPTIONS,
  YES_NO_OPTIONS,
} from '../../components/picker/appointment-picker-options';
import {
  CAT_BREEDS,
  CHRONIC_DISEASE_OPTIONS,
  BookingMode,
  ConsultationType,
  DOG_BREEDS,
  PetAppointmentForm,
} from '../../models/appointment-form.model';

export interface BookingModeOption {
  value: BookingMode;
  label: string;
}

export interface TypeOption {
  value: ConsultationType;
  label: string;
  icon: IconName;
}

@Directive()
export abstract class AppointmentFormBase implements OnInit {
  readonly appointmentService = inject(AppointmentService);
  protected readonly route = inject(ActivatedRoute);
  private readonly doctorApi = inject(DoctorApiService);

  doctors: Doctor[] = [];
  readonly chronicOptions = CHRONIC_DISEASE_OPTIONS;
  readonly dogBreeds = DOG_BREEDS;
  readonly catBreeds = CAT_BREEDS;

  readonly bookingModeOptions: BookingModeOption[] = [
    { value: 'emergency', label: 'Emergency' },
    { value: 'normal', label: 'Normal' },
  ];

  readonly typeOptions: TypeOption[] = [
    { value: 'Clinic Visit', label: 'Clinic', icon: 'stethoscope' },
    { value: 'Home Visit', label: 'Home Visit', icon: 'home' },
    { value: 'Online Consultation', label: 'Online', icon: 'monitor' },
  ];

  readonly healthSymptoms = [
    { key: 'vomiting' as const, label: 'Vomiting' },
    { key: 'diarrhea' as const, label: 'Diarrhea' },
    { key: 'fever' as const, label: 'Fever' },
    { key: 'coughing' as const, label: 'Coughing' },
    { key: 'sneezing' as const, label: 'Sneezing' },
    { key: 'difficultyWalking' as const, label: 'Difficulty Walking' },
    { key: 'breathingDifficulty' as const, label: 'Breathing Difficulty' },
  ];

  readonly emergencyQuestions = [
    { key: 'isEmergency' as const, label: 'Is this an emergency?' },
    { key: 'bleeding' as const, label: 'Bleeding?' },
    { key: 'poisonIngestion' as const, label: 'Poison Ingestion?' },
    { key: 'seizures' as const, label: 'Seizures?' },
    { key: 'unconscious' as const, label: 'Unconscious?' },
    { key: 'difficultyBreathing' as const, label: 'Difficulty Breathing?' },
  ];

  readonly speciesOptions = SPECIES_OPTIONS;
  readonly genderOptions = GENDER_OPTIONS;
  readonly yesNoOptions = YES_NO_OPTIONS;
  readonly severityOptions = SEVERITY_OPTIONS;
  readonly appetiteOptions = APPETITE_OPTIONS;
  readonly foodTypeOptions = FOOD_TYPE_OPTIONS;
  readonly timeOptions = TIME_OPTIONS;

  breedOptions = breedOptions;
  doctorPickerOptions = doctorPickerOptions;

  readonly documentFields = [
    { key: 'prescriptions' as const, label: 'Previous Prescriptions' },
    { key: 'bloodTests' as const, label: 'Blood Test Reports' },
    { key: 'xray' as const, label: 'X-ray Reports' },
    { key: 'ultrasound' as const, label: 'Ultrasound Reports' },
    { key: 'vaccinationCard' as const, label: 'Vaccination Card' },
    { key: 'medicalRecords' as const, label: 'Medical Records' },
    { key: 'problemPhotos' as const, label: 'Photos / Videos of the Problem' },
  ];

  get f(): PetAppointmentForm {
    return this.appointmentService.form();
  }

  get isEmergencyMode(): boolean {
    return this.f.appointment.bookingMode === 'emergency';
  }

  ngOnInit(): void {
    void this.loadDoctors();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      void this.appointmentService.loadBookingForEdit(id);
    }
  }

  private async loadDoctors(): Promise<void> {
    try {
      this.doctors = await firstValueFrom(this.doctorApi.list());
    } catch {
      this.doctors = [];
    }
  }

  save(): void {
    void this.appointmentService.saveBooking();
  }

  submit(): void {
    void this.appointmentService.finalizeBooking();
  }

  selectBookingMode(mode: BookingMode): void {
    this.appointmentService.form.update((form) => ({
      ...form,
      appointment: {
        ...form.appointment,
        bookingMode: mode,
        consultationType:
          mode === 'emergency' && !form.appointment.consultationType
            ? 'Home Visit'
            : form.appointment.consultationType,
      },
      emergency: {
        ...form.emergency,
        isEmergency: mode === 'emergency',
      },
    }));
  }

  selectType(value: ConsultationType): void {
    this.patchAppointment('consultationType', value);
  }

  onSpeciesChange(species: PetAppointmentForm['pet']['species']): void {
    this.appointmentService.form.update((form) => ({
      ...form,
      pet: { ...form.pet, species, breed: '' },
    }));
  }

  patchOwner<K extends keyof PetAppointmentForm['owner']>(key: K, value: PetAppointmentForm['owner'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, owner: { ...form.owner, [key]: value } }));
  }

  patchPet<K extends keyof PetAppointmentForm['pet']>(key: K, value: PetAppointmentForm['pet'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, pet: { ...form.pet, [key]: value } }));
  }

  patchAppointment<K extends keyof PetAppointmentForm['appointment']>(
    key: K,
    value: PetAppointmentForm['appointment'][K],
  ): void {
    this.appointmentService.form.update((form) => ({ ...form, appointment: { ...form.appointment, [key]: value } }));
  }

  patchHealth<K extends keyof PetAppointmentForm['health']>(key: K, value: PetAppointmentForm['health'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, health: { ...form.health, [key]: value } }));
  }

  patchPastMedical<K extends keyof PetAppointmentForm['pastMedical']>(
    key: K,
    value: PetAppointmentForm['pastMedical'][K],
  ): void {
    this.appointmentService.form.update((form) => ({ ...form, pastMedical: { ...form.pastMedical, [key]: value } }));
  }

  patchVaccination<K extends keyof PetAppointmentForm['vaccination']>(
    key: K,
    value: PetAppointmentForm['vaccination'][K],
  ): void {
    this.appointmentService.form.update((form) => ({ ...form, vaccination: { ...form.vaccination, [key]: value } }));
  }

  patchDeworming<K extends keyof PetAppointmentForm['deworming']>(key: K, value: PetAppointmentForm['deworming'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, deworming: { ...form.deworming, [key]: value } }));
  }

  patchTickFlea<K extends keyof PetAppointmentForm['tickFlea']>(key: K, value: PetAppointmentForm['tickFlea'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, tickFlea: { ...form.tickFlea, [key]: value } }));
  }

  patchMedications<K extends keyof PetAppointmentForm['medications']>(
    key: K,
    value: PetAppointmentForm['medications'][K],
  ): void {
    this.appointmentService.form.update((form) => ({ ...form, medications: { ...form.medications, [key]: value } }));
  }

  patchAllergies<K extends keyof PetAppointmentForm['allergies']>(key: K, value: PetAppointmentForm['allergies'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, allergies: { ...form.allergies, [key]: value } }));
  }

  patchDiet<K extends keyof PetAppointmentForm['diet']>(key: K, value: PetAppointmentForm['diet'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, diet: { ...form.diet, [key]: value } }));
  }

  patchLifestyle<K extends keyof PetAppointmentForm['lifestyle']>(key: K, value: PetAppointmentForm['lifestyle'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, lifestyle: { ...form.lifestyle, [key]: value } }));
  }

  patchReproductive<K extends keyof PetAppointmentForm['reproductive']>(
    key: K,
    value: PetAppointmentForm['reproductive'][K],
  ): void {
    this.appointmentService.form.update((form) => ({ ...form, reproductive: { ...form.reproductive, [key]: value } }));
  }

  patchDoctorNotes<K extends keyof PetAppointmentForm['doctorNotes']>(
    key: K,
    value: PetAppointmentForm['doctorNotes'][K],
  ): void {
    this.appointmentService.form.update((form) => ({ ...form, doctorNotes: { ...form.doctorNotes, [key]: value } }));
  }

  toggleHealthSymptom(
    key: keyof Pick<
      PetAppointmentForm['health'],
      'vomiting' | 'diarrhea' | 'fever' | 'coughing' | 'sneezing' | 'difficultyWalking' | 'breathingDifficulty'
    >,
  ): void {
    this.appointmentService.form.update((form) => ({ ...form, health: { ...form.health, [key]: !form.health[key] } }));
  }

  toggleChronic(disease: string): void {
    this.appointmentService.form.update((form) => {
      const list = form.pastMedical.chronicDiseases;
      const next = list.includes(disease) ? list.filter((d) => d !== disease) : [...list, disease];
      return { ...form, pastMedical: { ...form.pastMedical, chronicDiseases: next } };
    });
  }

  toggleEmergency(key: keyof PetAppointmentForm['emergency']): void {
    this.appointmentService.form.update((form) => ({ ...form, emergency: { ...form.emergency, [key]: !form.emergency[key] } }));
  }

  onProblemMedia(event: Event): void {
    void this.handleProblemMedia(event);
  }

  onVaccinationFiles(event: Event): void {
    void this.handleVaccinationFiles(event);
  }

  onDocumentFiles(key: keyof PetAppointmentForm['documents'], event: Event): void {
    void this.handleDocumentFiles(key, event);
  }

  private async handleProblemMedia(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;
    const hadBooking = !!this.appointmentService.editingBookingId();
    const added = await this.appointmentService.uploadFormFiles('problemMedia', files);
    if (!hadBooking) {
      this.patchHealth('problemMediaFiles', [...this.f.health.problemMediaFiles, ...added]);
    }
    input.value = '';
  }

  private async handleVaccinationFiles(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;
    const hadBooking = !!this.appointmentService.editingBookingId();
    const added = await this.appointmentService.uploadFormFiles('vaccinationCard', files);
    if (!hadBooking) {
      this.patchVaccination('vaccinationCardFiles', [...this.f.vaccination.vaccinationCardFiles, ...added]);
    }
    input.value = '';
  }

  private async handleDocumentFiles(
    key: keyof PetAppointmentForm['documents'],
    event: Event,
  ): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;
    const hadBooking = !!this.appointmentService.editingBookingId();
    const added = await this.appointmentService.uploadFormFiles(`documents.${key}`, files);
    if (!hadBooking) {
      this.appointmentService.form.update((form) => ({
        ...form,
        documents: { ...form.documents, [key]: [...form.documents[key], ...added] },
      }));
    }
    input.value = '';
  }
}
