import { Component, computed, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../components/icon/icon.component';
import { IconName } from '../../components/icon/icon.types';
import { VosDatePickerComponent } from '../../components/picker/vos-date-picker.component';
import { VosSelectComponent } from '../../components/picker/vos-select.component';
import { VosTimePickerComponent } from '../../components/picker/vos-time-picker.component';
import { toPickerOptions } from '../../components/picker/picker.utils';
import { AppointmentFormBase } from './appointment-form.base';
import { ConsultationType } from '../../models/appointment-form.model';

interface IntakeStep {
  n: number;
  title: string;
  icon: IconName;
}

@Component({
  selector: 'app-quick-add-appointment',
  imports: [FormsModule, IconComponent, VosSelectComponent, VosDatePickerComponent, VosTimePickerComponent],
  templateUrl: './quick-add-appointment.component.html',
})
export class QuickAddAppointmentComponent extends AppointmentFormBase {
  private readonly location = inject(Location);

  readonly clinicPhone = '+911234567890';
  readonly currentStep = signal(1);
  readonly submitted = signal(false);
  readonly refId = signal('');
  readonly consent = signal(false);
  readonly routineOnly = signal(false);
  readonly openAccordions = signal<Record<string, boolean>>({
    vac: true,
    deworm: false,
    tick: false,
    meds: true,
    allergy: true,
    diet: false,
    lifestyle: false,
    repro: false,
  });

  readonly visitReasonOptions = toPickerOptions(
    [
      'Routine checkup / wellness',
      'Vaccination',
      'Illness or injury',
      'Follow-up visit',
      'Grooming',
      'Other',
    ],
    'Choose one',
  );

  readonly waterOptions = toPickerOptions(['Normal', 'Increased', 'Reduced', 'Not Drinking'], 'Choose');
  readonly yesNoUnsure = toPickerOptions(['Yes', 'No', 'Not Sure'], 'Choose');
  readonly indoorOptions = toPickerOptions(['Indoor', 'Outdoor', 'Both'], 'Choose');
  readonly exerciseOptions = toPickerOptions(['Low', 'Moderate', 'High'], 'Choose');
  readonly yesNoChoose = toPickerOptions(['Yes', 'No'], 'Choose');
  readonly pregnantOptions = toPickerOptions(['Yes', 'No', 'Not sure'], 'Choose');

  readonly steps: IntakeStep[] = [
    { n: 1, title: 'Emergency check', icon: 'alert' },
    { n: 2, title: 'Owner details', icon: 'user' },
    { n: 3, title: 'Pet profile', icon: 'paw' },
    { n: 4, title: 'Appointment', icon: 'calendar' },
    { n: 5, title: 'Health problem', icon: 'heart' },
    { n: 6, title: 'Medical history', icon: 'stethoscope' },
    { n: 7, title: 'Additional info', icon: 'clipboard' },
    { n: 8, title: 'Documents', icon: 'paperclip' },
    { n: 9, title: 'Review & submit', icon: 'check' },
  ];

  readonly totalSteps = this.steps.length;

  readonly progressPct = computed(() => Math.round((this.currentStep() / this.totalSteps) * 100));

  readonly stepMeta = computed(() => {
    const step = this.steps[this.currentStep() - 1];
    return `Step ${this.currentStep()} of ${this.totalSteps} — ${step.title}`;
  });

  readonly isEmergency = computed(() => this.f.appointment.bookingMode === 'emergency');

  readonly reviewSections = computed(() => {
    const f = this.f;
    return [
      {
        title: 'Emergency',
        step: 1,
        items: [
          ['Mode', this.isEmergency() ? 'Emergency' : 'Routine'],
          ['Flags', this.emergencyFlagLabel()],
        ],
      },
      {
        title: 'Owner',
        step: 2,
        items: [
          ['Name', f.owner.fullName],
          ['Mobile', f.owner.mobile],
          ['Email', f.owner.email],
          ['Address', f.owner.address],
          ['Emergency contact', f.owner.emergencyContact],
        ],
      },
      {
        title: 'Pet',
        step: 3,
        items: [
          ['Name', f.pet.name],
          ['Species', f.pet.species],
          ['Breed', f.pet.breed],
          ['Gender', f.pet.gender],
          ['Age / DOB', f.pet.ageOrDob],
          ['Weight', f.pet.weight],
          ['Neutered', f.pet.neutered],
        ],
      },
      {
        title: 'Appointment',
        step: 4,
        items: [
          ['Date', f.appointment.preferredDate],
          ['Time', f.appointment.preferredTime],
          ['Type', f.appointment.consultationType],
          ['Doctor', f.appointment.doctorPreference],
          ['Reason', f.appointment.reasonForVisit],
        ],
      },
      {
        title: 'Health',
        step: 5,
        items: [
          ['Complaint', f.health.mainComplaint],
          ['Since', f.health.sinceWhen],
          ['Severity', f.health.severity],
          ['Appetite', f.health.appetite],
        ],
      },
    ];
  });

  readonly missingConfirmFields = computed(() => {
    const f = this.f;
    const missing: string[] = [];
    if (!f.owner.fullName.trim()) missing.push('owner name');
    if (!f.pet.name.trim()) missing.push('pet name');
    if (!f.appointment.preferredDate.trim()) missing.push('appointment date');
    return missing;
  });

  readonly canConfirm = computed(() => this.consent() && this.missingConfirmFields().length === 0);

  readonly confirmHint = computed(() => {
    const missing = this.missingConfirmFields();
    if (!missing.length) return '';
    return `Add ${missing.join(', ')} before confirming. Use Edit on the sections above.`;
  });

  close(): void {
    this.appointmentService.cancel(this.appointmentFrom());
  }

  goBackNav(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    this.close();
  }

  private appointmentFrom(): 'dashboard' | 'bookings' {
    return this.route.snapshot.queryParamMap.get('from') === 'bookings' ? 'bookings' : 'dashboard';
  }

  goToStep(n: number): void {
    if (n < 1 || n > this.totalSteps) return;
    this.currentStep.set(n);
  }

  next(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update((s) => s + 1);
    }
  }

  prev(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  setEmergency(isEmg: boolean): void {
    this.selectBookingMode(isEmg ? 'emergency' : 'normal');
  }

  selectConsult(type: ConsultationType): void {
    this.selectType(type);
  }

  toggleAccordion(key: string): void {
    this.openAccordions.update((m) => ({ ...m, [key]: !m[key] }));
  }

  isAccordionOpen(key: string): boolean {
    return !!this.openAccordions()[key];
  }

  setRoutineOnly(checked: boolean): void {
    this.routineOnly.set(checked);
    if (checked) {
      this.patchHealth('mainComplaint', 'Routine / wellness visit');
    }
  }

  setNoneKnown(field: 'medicine' | 'food' | 'environmental'): void {
    this.patchAllergies(field, 'None known');
  }

  onDocFiles(event: Event): void {
    this.onDocumentFiles('medicalRecords', event);
  }

  submitIntake(): void {
    if (!this.canConfirm()) return;
    void this.saveIntake();
  }

  private async saveIntake(): Promise<void> {
    const booking = await this.appointmentService.saveBooking();
    if (booking) {
      this.refId.set(booking.id);
      this.submitted.set(true);
    }
  }

  submitAnother(): void {
    this.appointmentService.resetForm();
    this.submitted.set(false);
    this.consent.set(false);
    this.routineOnly.set(false);
    this.currentStep.set(1);
  }

  finish(): void {
    void this.appointmentService.finalizeBooking();
  }

  private emergencyFlagLabel(): string {
    const e = this.f.emergency;
    const flags = [
      e.bleeding && 'Bleeding',
      e.poisonIngestion && 'Poison',
      e.seizures && 'Seizures',
      e.unconscious && 'Unconscious',
      e.difficultyBreathing && 'Breathing difficulty',
    ].filter(Boolean);
    return flags.length ? flags.join(', ') : 'None';
  }
}
