import { Component, inject, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AppointmentService } from '../../services/appointment.service';
import { DoctorApiService } from '../../services/doctor-api.service';
import { IconComponent } from '../../components/icon/icon.component';
import { IconName } from '../../components/icon/icon.types';
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
import { VosDatePickerComponent } from '../../components/picker/vos-date-picker.component';
import { VosSelectComponent } from '../../components/picker/vos-select.component';
import { VosTimePickerComponent } from '../../components/picker/vos-time-picker.component';
import { Doctor } from '../../models/doctor.model';
import {
  CAT_BREEDS,
  CHRONIC_DISEASE_OPTIONS,
  BookingMode,
  ConsultationType,
  DOG_BREEDS,
  PetAppointmentForm,
} from '../../models/appointment-form.model';

interface BookingModeOption {
  value: BookingMode;
  label: string;
}

interface TypeOption {
  value: ConsultationType;
  label: string;
  icon: IconName;
}

@Component({
  selector: 'app-add-appointment',
  imports: [FormsModule, IconComponent, VosSelectComponent, VosDatePickerComponent, VosTimePickerComponent],
  template: `
    <div class="appointment-form-page">
      <header class="appointment-form-header">
        <div class="appointment-form-header__title">
          <button type="button" class="btn-outline form-back-btn appointment-form-header__back" (click)="back()">
            <app-icon name="arrow-left" size="sm" />
            Back
          </button>
          <h1>{{ appointmentService.isEditing() ? 'Edit Appointment' : 'New Appointment' }}</h1>
        </div>
        <div class="appointment-form-header__actions">
          <button type="button" class="btn-outline" (click)="close()">
            <app-icon name="close" size="sm" />
            Close
          </button>
          <button type="button" class="btn-primary" (click)="save()">
            <app-icon name="check" size="sm" />
            {{ appointmentService.isEditing() ? 'Save Changes' : 'Save' }}
          </button>
          <button type="button" class="btn-primary" (click)="submit()">
            Submit
          </button>
        </div>
      </header>

      <div class="appointment-form-card">
        <section class="appointment-form-section appointment-form-section--compact">
          <h2>Booking Type</h2>
          <div class="booking-mode-picker">
            @for (opt of bookingModeOptions; track opt.value) {
              <button
                type="button"
                class="booking-mode-picker__option"
                [class.booking-mode-picker__option--selected]="f.appointment.bookingMode === opt.value"
                [class.booking-mode-picker__option--emergency]="opt.value === 'emergency'"
                (click)="selectBookingMode(opt.value)"
              >
                <span class="booking-mode-picker__circle" aria-hidden="true"></span>
                <span class="booking-mode-picker__label">{{ opt.label }}</span>
              </button>
            }
          </div>
        </section>

        @if (isEmergencyMode) {
          <section class="appointment-form-section">
            <h2>Owner Information</h2>
            <div class="appointment-form-grid">
              <label class="form-field"><span>Owner Name</span><input type="text" [ngModel]="f.owner.fullName" (ngModelChange)="patchOwner('fullName', $event)" /></label>
              <label class="form-field"><span>Mobile Number</span><input type="tel" [ngModel]="f.owner.mobile" (ngModelChange)="patchOwner('mobile', $event)" /></label>
              <label class="form-field"><span>Email</span><input type="email" [ngModel]="f.owner.email" (ngModelChange)="patchOwner('email', $event)" placeholder="Optional" /></label>
              <label class="form-field form-field--full"><span>Address</span><input type="text" [ngModel]="f.owner.address" (ngModelChange)="patchOwner('address', $event)" /></label>
            </div>
          </section>

          <section class="appointment-form-section">
            <h2>Pet Information</h2>
            <div class="appointment-form-grid">
              <label class="form-field"><span>Pet Name</span><input type="text" [ngModel]="f.pet.name" (ngModelChange)="patchPet('name', $event)" /></label>
              <label class="form-field">
                <span>Species</span>
                <app-vos-select [options]="speciesOptions" panelTitle="Species" placeholder="Select species" [ngModel]="f.pet.species" (ngModelChange)="onSpeciesChange($event)" />
              </label>
              @if (f.pet.species === 'Dog') {
                <label class="form-field">
                  <span>Breed</span>
                  <app-vos-select [options]="breedOptions(f.pet.species, 'Optional', 'Optional', 'Optional')" panelTitle="Breed" placeholder="Optional" [ngModel]="f.pet.breed" (ngModelChange)="patchPet('breed', $event)" />
                </label>
              } @else if (f.pet.species === 'Cat') {
                <label class="form-field">
                  <span>Breed</span>
                  <app-vos-select [options]="breedOptions(f.pet.species, 'Optional', 'Optional', 'Optional')" panelTitle="Breed" placeholder="Optional" [ngModel]="f.pet.breed" (ngModelChange)="patchPet('breed', $event)" />
                </label>
              } @else if (f.pet.species) {
                <label class="form-field"><span>Breed</span><input type="text" [ngModel]="f.pet.breed" (ngModelChange)="patchPet('breed', $event)" placeholder="Optional" /></label>
              }
            </div>
          </section>

          <section class="appointment-form-section appointment-form-section--last">
            <h2>Appointment</h2>
            <div class="appointment-form-grid">
              <label class="form-field">
                <span>Preferred Date</span>
                <app-vos-date-picker [ngModel]="f.appointment.preferredDate" (ngModelChange)="patchAppointment('preferredDate', $event)" />
              </label>
              <label class="form-field">
                <span>Preferred Time</span>
                <app-vos-time-picker [ngModel]="f.appointment.preferredTime" (ngModelChange)="patchAppointment('preferredTime', $event)" />
              </label>
              <label class="form-field form-field--full">
                <span>Preferred Veterinarian</span>
                <app-vos-select [options]="doctorPickerOptions(doctors, 'Optional')" panelTitle="Veterinarian" placeholder="Optional" [ngModel]="f.appointment.doctorPreference" (ngModelChange)="patchAppointment('doctorPreference', $event)" />
              </label>
              <label class="form-field form-field--full">
                <span>Reason for Visit</span>
                <textarea rows="2" [ngModel]="f.appointment.reasonForVisit" (ngModelChange)="patchAppointment('reasonForVisit', $event)"></textarea>
              </label>
              <label class="form-field form-field--full">
                <span>Additional Notes</span>
                <textarea rows="2" [ngModel]="f.appointment.additionalNotes" (ngModelChange)="patchAppointment('additionalNotes', $event)" placeholder="Optional"></textarea>
              </label>
            </div>
          </section>
        } @else {
        <section class="appointment-form-section">
          <h2>Appointment Type</h2>
          <div class="appointment-type-grid">
            @for (opt of typeOptions; track opt.value) {
              <button
                type="button"
                class="appointment-type-grid__card"
                [class.appointment-type-grid__card--selected]="f.appointment.consultationType === opt.value"
                (click)="selectType(opt.value)"
              >
                <span class="appointment-type-grid__icon">
                  <app-icon [name]="opt.icon" size="lg" />
                </span>
                <span>{{ opt.label }}</span>
              </button>
            }
          </div>
        </section>

        <section class="appointment-form-section">
          <h2>Date & Time</h2>
          <div class="appointment-form-grid">
            <label class="form-field">
              <span>Preferred Date</span>
              <app-vos-date-picker [ngModel]="f.appointment.preferredDate" (ngModelChange)="patchAppointment('preferredDate', $event)" />
            </label>
            <label class="form-field">
              <span>Preferred Time</span>
              <app-vos-time-picker [ngModel]="f.appointment.preferredTime" (ngModelChange)="patchAppointment('preferredTime', $event)" />
            </label>
            <label class="form-field form-field--full">
              <span>Doctor Preference</span>
              <app-vos-select [options]="doctorPickerOptions(doctors, 'No preference')" panelTitle="Doctor Preference" placeholder="No preference" [ngModel]="f.appointment.doctorPreference" (ngModelChange)="patchAppointment('doctorPreference', $event)" />
            </label>
            <label class="form-field form-field--full">
              <span>Reason for Visit</span>
              <textarea rows="2" [ngModel]="f.appointment.reasonForVisit" (ngModelChange)="patchAppointment('reasonForVisit', $event)"></textarea>
            </label>
          </div>
        </section>

        <section class="appointment-form-section">
          <h2>Pet Owner</h2>
          <div class="appointment-form-grid">
            <label class="form-field"><span>Full Name</span><input type="text" [ngModel]="f.owner.fullName" (ngModelChange)="patchOwner('fullName', $event)" /></label>
            <label class="form-field"><span>Mobile Number</span><input type="tel" [ngModel]="f.owner.mobile" (ngModelChange)="patchOwner('mobile', $event)" /></label>
            <label class="form-field"><span>Email</span><input type="email" [ngModel]="f.owner.email" (ngModelChange)="patchOwner('email', $event)" /></label>
            <label class="form-field"><span>Emergency Contact</span><input type="text" [ngModel]="f.owner.emergencyContact" (ngModelChange)="patchOwner('emergencyContact', $event)" /></label>
            <label class="form-field form-field--full"><span>Address</span><input type="text" [ngModel]="f.owner.address" (ngModelChange)="patchOwner('address', $event)" /></label>
          </div>
        </section>

        <section class="appointment-form-section">
          <h2>Pet Details</h2>
          <div class="appointment-form-grid">
            <label class="form-field"><span>Pet Name</span><input type="text" [ngModel]="f.pet.name" (ngModelChange)="patchPet('name', $event)" /></label>
            <label class="form-field">
              <span>Species</span>
              <app-vos-select [options]="speciesOptions" panelTitle="Species" placeholder="Select species" [ngModel]="f.pet.species" (ngModelChange)="onSpeciesChange($event)" />
            </label>
            @if (f.pet.species === 'Dog') {
              <label class="form-field">
                <span>Breed</span>
                <app-vos-select [options]="breedOptions(f.pet.species)" panelTitle="Breed" placeholder="Select dog breed" [ngModel]="f.pet.breed" (ngModelChange)="patchPet('breed', $event)" />
              </label>
            } @else if (f.pet.species === 'Cat') {
              <label class="form-field">
                <span>Breed</span>
                <app-vos-select [options]="breedOptions(f.pet.species, 'Select dog breed', 'Select cat breed')" panelTitle="Breed" placeholder="Select cat breed" [ngModel]="f.pet.breed" (ngModelChange)="patchPet('breed', $event)" />
              </label>
            } @else {
              <label class="form-field"><span>Breed</span><input type="text" [ngModel]="f.pet.breed" (ngModelChange)="patchPet('breed', $event)" placeholder="Enter breed" /></label>
            }
            <label class="form-field">
              <span>Gender</span>
              <app-vos-select [options]="genderOptions" panelTitle="Gender" placeholder="Select gender" [ngModel]="f.pet.gender" (ngModelChange)="patchPet('gender', $event)" />
            </label>
            <label class="form-field"><span>Age / Date of Birth</span><input type="text" [ngModel]="f.pet.ageOrDob" (ngModelChange)="patchPet('ageOrDob', $event)" /></label>
            <label class="form-field"><span>Weight</span><input type="text" [ngModel]="f.pet.weight" (ngModelChange)="patchPet('weight', $event)" /></label>
            <label class="form-field"><span>Color / Marks</span><input type="text" [ngModel]="f.pet.colorMarks" (ngModelChange)="patchPet('colorMarks', $event)" /></label>
            <label class="form-field"><span>Microchip</span><input type="text" [ngModel]="f.pet.microchip" (ngModelChange)="patchPet('microchip', $event)" /></label>
            <label class="form-field">
              <span>Neutered / Spayed</span>
              <app-vos-select [options]="yesNoOptions" panelTitle="Neutered / Spayed" placeholder="Select" [ngModel]="f.pet.neutered" (ngModelChange)="patchPet('neutered', $event)" />
            </label>
          </div>
        </section>

        <section class="appointment-form-section">
          <h2>Current Health Problem</h2>
          <div class="appointment-form-grid">
            <label class="form-field form-field--full"><span>Main Complaint</span><textarea rows="2" [ngModel]="f.health.mainComplaint" (ngModelChange)="patchHealth('mainComplaint', $event)"></textarea></label>
            <label class="form-field form-field--full"><span>Symptoms</span><textarea rows="2" [ngModel]="f.health.symptoms" (ngModelChange)="patchHealth('symptoms', $event)"></textarea></label>
            <label class="form-field"><span>Since When?</span><input type="text" [ngModel]="f.health.sinceWhen" (ngModelChange)="patchHealth('sinceWhen', $event)" /></label>
            <label class="form-field">
              <span>Severity</span>
              <app-vos-select [options]="severityOptions" panelTitle="Severity" placeholder="Select severity" [ngModel]="f.health.severity" (ngModelChange)="patchHealth('severity', $event)" />
            </label>
            <label class="form-field">
              <span>Appetite</span>
              <app-vos-select [options]="appetiteOptions" panelTitle="Appetite" placeholder="Select" [ngModel]="f.health.appetite" (ngModelChange)="patchHealth('appetite', $event)" />
            </label>
            <label class="form-field"><span>Water Intake</span><input type="text" [ngModel]="f.health.waterIntake" (ngModelChange)="patchHealth('waterIntake', $event)" /></label>
            <label class="form-field"><span>Pain Area</span><input type="text" [ngModel]="f.health.painArea" (ngModelChange)="patchHealth('painArea', $event)" /></label>
            <label class="form-field"><span>Injury / Accident</span><input type="text" [ngModel]="f.health.injuryAccident" (ngModelChange)="patchHealth('injuryAccident', $event)" /></label>
            <label class="form-field form-field--full"><span>Upload Photos / Videos</span><input type="file" multiple accept="image/*,video/*" (change)="onProblemMedia($event)" />@if (f.health.problemMediaFiles.length) { <small class="file-list">{{ f.health.problemMediaFiles.join(', ') }}</small> }</label>
          </div>
          <div class="checkbox-grid">
            @for (sym of healthSymptoms; track sym.key) {
              <label class="checkbox-field"><input type="checkbox" [checked]="f.health[sym.key]" (change)="toggleHealthSymptom(sym.key)" />{{ sym.label }}</label>
            }
          </div>
          <div class="appointment-form-subsection">
            <h3>Emergency Flags</h3>
            <div class="checkbox-grid">
              @for (q of emergencyQuestions; track q.key) {
                <label class="checkbox-field"><input type="checkbox" [checked]="f.emergency[q.key]" (change)="toggleEmergency(q.key)" />{{ q.label }}</label>
              }
            </div>
          </div>
        </section>

        <section class="appointment-form-section">
          <h2>Medical History</h2>
          <div class="appointment-form-subsection">
            <h3>Previous Problems</h3>
            <div class="appointment-form-grid">
              <label class="form-field form-field--full"><span>Previous Illnesses</span><textarea rows="2" [ngModel]="f.pastMedical.previousIllnesses" (ngModelChange)="patchPastMedical('previousIllnesses', $event)"></textarea></label>
              <label class="form-field form-field--full"><span>Previous Surgeries</span><textarea rows="2" [ngModel]="f.pastMedical.previousSurgeries" (ngModelChange)="patchPastMedical('previousSurgeries', $event)"></textarea></label>
              <label class="form-field form-field--full"><span>Previous Hospitalization</span><textarea rows="2" [ngModel]="f.pastMedical.previousHospitalization" (ngModelChange)="patchPastMedical('previousHospitalization', $event)"></textarea></label>
            </div>
            <div class="checkbox-grid">
              @for (disease of chronicOptions; track disease) {
                <label class="checkbox-field"><input type="checkbox" [checked]="f.pastMedical.chronicDiseases.includes(disease)" (change)="toggleChronic(disease)" />{{ disease }}</label>
              }
            </div>
          </div>
          <div class="appointment-form-subsection">
            <h3>Vaccination & Prevention</h3>
            <div class="appointment-form-grid">
              <label class="form-field">
                <span>Vaccinated?</span>
                <app-vos-select [options]="yesNoOptions" panelTitle="Vaccinated" placeholder="Select" [ngModel]="f.vaccination.vaccinated" (ngModelChange)="patchVaccination('vaccinated', $event)" />
              </label>
              <label class="form-field"><span>Last Vaccination Date</span><app-vos-date-picker [ngModel]="f.vaccination.lastVaccinationDate" (ngModelChange)="patchVaccination('lastVaccinationDate', $event)" /></label>
              <label class="form-field form-field--full"><span>Vaccine Names</span><input type="text" [ngModel]="f.vaccination.vaccineNames" (ngModelChange)="patchVaccination('vaccineNames', $event)" /></label>
              <label class="form-field"><span>Last Deworming Date</span><app-vos-date-picker [ngModel]="f.deworming.lastDate" (ngModelChange)="patchDeworming('lastDate', $event)" /></label>
              <label class="form-field"><span>Deworming Medicine</span><input type="text" [ngModel]="f.deworming.medicine" (ngModelChange)="patchDeworming('medicine', $event)" /></label>
              <label class="form-field"><span>Last Tick / Flea Treatment</span><app-vos-date-picker [ngModel]="f.tickFlea.lastTreatmentDate" (ngModelChange)="patchTickFlea('lastTreatmentDate', $event)" /></label>
              <label class="form-field"><span>Product Used</span><input type="text" [ngModel]="f.tickFlea.productUsed" (ngModelChange)="patchTickFlea('productUsed', $event)" /></label>
              <label class="form-field form-field--full"><span>Upload Vaccination Card</span><input type="file" multiple (change)="onVaccinationFiles($event)" />@if (f.vaccination.vaccinationCardFiles.length) { <small class="file-list">{{ f.vaccination.vaccinationCardFiles.join(', ') }}</small> }</label>
            </div>
          </div>
          <div class="appointment-form-subsection">
            <h3>Medications & Allergies</h3>
            <div class="appointment-form-grid">
              <label class="form-field"><span>Medicine Name</span><input type="text" [ngModel]="f.medications.medicineName" (ngModelChange)="patchMedications('medicineName', $event)" /></label>
              <label class="form-field"><span>Dosage</span><input type="text" [ngModel]="f.medications.dosage" (ngModelChange)="patchMedications('dosage', $event)" /></label>
              <label class="form-field"><span>Since When</span><input type="text" [ngModel]="f.medications.sinceWhen" (ngModelChange)="patchMedications('sinceWhen', $event)" /></label>
              <label class="form-field"><span>Supplements</span><input type="text" [ngModel]="f.medications.supplements" (ngModelChange)="patchMedications('supplements', $event)" /></label>
              <label class="form-field"><span>Medicine Allergies</span><input type="text" [ngModel]="f.allergies.medicine" (ngModelChange)="patchAllergies('medicine', $event)" /></label>
              <label class="form-field"><span>Food Allergies</span><input type="text" [ngModel]="f.allergies.food" (ngModelChange)="patchAllergies('food', $event)" /></label>
              <label class="form-field form-field--full"><span>Environmental Allergies</span><input type="text" [ngModel]="f.allergies.environmental" (ngModelChange)="patchAllergies('environmental', $event)" /></label>
            </div>
          </div>
          <div class="appointment-form-subsection">
            <h3>Reproductive History</h3>
            <div class="appointment-form-grid">
              <label class="form-field">
                <span>Pregnant?</span>
                <app-vos-select [options]="yesNoOptions" panelTitle="Pregnant" placeholder="Select" [ngModel]="f.reproductive.pregnant" (ngModelChange)="patchReproductive('pregnant', $event)" />
              </label>
              <label class="form-field"><span>Last Heat Cycle</span><input type="text" [ngModel]="f.reproductive.lastHeatCycle" (ngModelChange)="patchReproductive('lastHeatCycle', $event)" /></label>
              <label class="form-field"><span>Breeding History</span><input type="text" [ngModel]="f.reproductive.breedingHistory" (ngModelChange)="patchReproductive('breedingHistory', $event)" /></label>
              <label class="form-field"><span>Number of Litters</span><input type="text" [ngModel]="f.reproductive.numberOfLitters" (ngModelChange)="patchReproductive('numberOfLitters', $event)" /></label>
            </div>
          </div>
        </section>

        <section class="appointment-form-section">
          <h2>Lifestyle & Diet</h2>
          <div class="appointment-form-subsection">
            <h3>Diet</h3>
            <div class="appointment-form-grid">
              <label class="form-field">
                <span>Food Type</span>
                <app-vos-select [options]="foodTypeOptions" panelTitle="Food Type" placeholder="Select" [ngModel]="f.diet.foodType" (ngModelChange)="patchDiet('foodType', $event)" />
              </label>
              <label class="form-field"><span>Brand Name</span><input type="text" [ngModel]="f.diet.brandName" (ngModelChange)="patchDiet('brandName', $event)" /></label>
              <label class="form-field"><span>Feeding Frequency</span><input type="text" [ngModel]="f.diet.feedingFrequency" (ngModelChange)="patchDiet('feedingFrequency', $event)" /></label>
              <label class="form-field"><span>Treats Given</span><input type="text" [ngModel]="f.diet.treatsGiven" (ngModelChange)="patchDiet('treatsGiven', $event)" /></label>
            </div>
          </div>
          <div class="appointment-form-subsection">
            <h3>Lifestyle</h3>
            <div class="appointment-form-grid">
              <label class="form-field"><span>Indoor / Outdoor</span><input type="text" [ngModel]="f.lifestyle.indoorOutdoor" (ngModelChange)="patchLifestyle('indoorOutdoor', $event)" /></label>
              <label class="form-field"><span>Exercise Level</span><input type="text" [ngModel]="f.lifestyle.exerciseLevel" (ngModelChange)="patchLifestyle('exerciseLevel', $event)" /></label>
              <label class="form-field"><span>Contact with Other Animals</span><input type="text" [ngModel]="f.lifestyle.contactOtherAnimals" (ngModelChange)="patchLifestyle('contactOtherAnimals', $event)" /></label>
              <label class="form-field"><span>Recent Travel</span><input type="text" [ngModel]="f.lifestyle.recentTravel" (ngModelChange)="patchLifestyle('recentTravel', $event)" /></label>
              <label class="form-field"><span>Exposure to Ticks</span><input type="text" [ngModel]="f.lifestyle.tickExposure" (ngModelChange)="patchLifestyle('tickExposure', $event)" /></label>
            </div>
          </div>
        </section>

        <section class="appointment-form-section appointment-form-section--last">
          <h2>Documents & Notes</h2>
          <div class="appointment-form-grid">
            @for (doc of documentFields; track doc.key) {
              <label class="form-field form-field--full">
                <span>{{ doc.label }}</span>
                <input type="file" multiple (change)="onDocumentFiles(doc.key, $event)" />
                @if (f.documents[doc.key].length) { <small class="file-list">{{ f.documents[doc.key].join(', ') }}</small> }
              </label>
            }
            <label class="form-field form-field--full"><span>Diagnosis (internal)</span><textarea rows="2" [ngModel]="f.doctorNotes.diagnosis" (ngModelChange)="patchDoctorNotes('diagnosis', $event)"></textarea></label>
            <label class="form-field form-field--full"><span>Clinical Findings</span><textarea rows="2" [ngModel]="f.doctorNotes.clinicalFindings" (ngModelChange)="patchDoctorNotes('clinicalFindings', $event)"></textarea></label>
            <label class="form-field form-field--full"><span>Treatment Plan</span><textarea rows="2" [ngModel]="f.doctorNotes.treatmentPlan" (ngModelChange)="patchDoctorNotes('treatmentPlan', $event)"></textarea></label>
          </div>
        </section>
        }
      </div>
    </div>
  `,
})
export class AddAppointmentComponent implements OnInit {
  readonly appointmentService = inject(AppointmentService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
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

  readonly documentFields = [
    { key: 'prescriptions' as const, label: 'Previous Prescriptions' },
    { key: 'bloodTests' as const, label: 'Blood Test Reports' },
    { key: 'xray' as const, label: 'X-ray Reports' },
    { key: 'ultrasound' as const, label: 'Ultrasound Reports' },
    { key: 'vaccinationCard' as const, label: 'Vaccination Card' },
    { key: 'medicalRecords' as const, label: 'Medical Records' },
    { key: 'problemPhotos' as const, label: 'Photos / Videos of the Problem' },
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

  close(): void {
    this.appointmentService.cancel(this.appointmentFrom());
  }

  back(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    this.appointmentService.cancel(this.appointmentFrom());
  }

  private appointmentFrom(): 'dashboard' | 'bookings' {
    return this.route.snapshot.queryParamMap.get('from') === 'bookings' ? 'bookings' : 'dashboard';
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

  patchAppointment<K extends keyof PetAppointmentForm['appointment']>(key: K, value: PetAppointmentForm['appointment'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, appointment: { ...form.appointment, [key]: value } }));
  }

  patchHealth<K extends keyof PetAppointmentForm['health']>(key: K, value: PetAppointmentForm['health'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, health: { ...form.health, [key]: value } }));
  }

  patchPastMedical<K extends keyof PetAppointmentForm['pastMedical']>(key: K, value: PetAppointmentForm['pastMedical'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, pastMedical: { ...form.pastMedical, [key]: value } }));
  }

  patchVaccination<K extends keyof PetAppointmentForm['vaccination']>(key: K, value: PetAppointmentForm['vaccination'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, vaccination: { ...form.vaccination, [key]: value } }));
  }

  patchDeworming<K extends keyof PetAppointmentForm['deworming']>(key: K, value: PetAppointmentForm['deworming'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, deworming: { ...form.deworming, [key]: value } }));
  }

  patchTickFlea<K extends keyof PetAppointmentForm['tickFlea']>(key: K, value: PetAppointmentForm['tickFlea'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, tickFlea: { ...form.tickFlea, [key]: value } }));
  }

  patchMedications<K extends keyof PetAppointmentForm['medications']>(key: K, value: PetAppointmentForm['medications'][K]): void {
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

  patchReproductive<K extends keyof PetAppointmentForm['reproductive']>(key: K, value: PetAppointmentForm['reproductive'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, reproductive: { ...form.reproductive, [key]: value } }));
  }

  patchDoctorNotes<K extends keyof PetAppointmentForm['doctorNotes']>(key: K, value: PetAppointmentForm['doctorNotes'][K]): void {
    this.appointmentService.form.update((form) => ({ ...form, doctorNotes: { ...form.doctorNotes, [key]: value } }));
  }

  toggleHealthSymptom(key: keyof Pick<PetAppointmentForm['health'], 'vomiting' | 'diarrhea' | 'fever' | 'coughing' | 'sneezing' | 'difficultyWalking' | 'breathingDifficulty'>): void {
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
