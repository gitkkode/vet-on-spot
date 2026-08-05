import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  DOCTOR_SPECIALTIES,
  Doctor,
  DoctorForm,
  DoctorStatus,
  createEmptyDoctorForm,
} from '../../models/doctor.model';
import { getDoctorStatusLabel } from '../../utils/doctor.utils';
import { DoctorApiService } from '../../services/doctor-api.service';
import { IconComponent } from '../../components/icon/icon.component';
import { DOCTOR_STATUS_OPTIONS } from '../../components/picker/appointment-picker-options';
import { toPickerOptions } from '../../components/picker/picker.utils';
import { VosSelectComponent } from '../../components/picker/vos-select.component';

type DoctorFilter = 'all' | DoctorStatus;

@Component({
  selector: 'app-doctors',
  imports: [FormsModule, IconComponent, VosSelectComponent],
  template: `
    <div class="doctors-page">
      <div class="page-header doctors-page__header">
        <div>
          <h1>Doctors</h1>
          <p>View profiles, availability, and current locations</p>
        </div>
        <button type="button" class="btn-primary doctors-page__add-btn" (click)="openAddDoctor()">
          <app-icon name="plus" size="sm" />
          Add New Doctor
        </button>
      </div>

      <div class="filter-bar">
        @for (f of filters; track f.key) {
          <button
            type="button"
            [class.active]="activeFilter() === f.key"
            (click)="activeFilter.set(f.key)"
          >
            {{ f.label }}
          </button>
        }
      </div>

      @if (loadError()) {
        <p class="doctors-page__error">{{ loadError() }}</p>
      } @else if (loading()) {
        <p class="doctors-page__loading">Loading doctors…</p>
      }

      <div class="doctors-grid doctors-page__grid">
        @for (d of filteredDoctors(); track d.id) {
          <article class="doctor-card" (click)="openProfile(d)">
            <div class="doctor-card__header">
              <div class="doctor-card__avatar">{{ d.initials }}</div>
              <div>
                <h3 class="doctor-card__name">{{ d.name }}</h3>
                <p class="doctor-card__specialty">{{ d.specialty }}</p>
              </div>
            </div>
            <div class="doctor-card__status-row">
              <span class="status-dot status-dot--{{ d.status }}"></span>
              {{ statusLabel(d.status) }}
            </div>
            <div class="doctor-card__location icon-inline">
              <app-icon name="map-pin" size="sm" /> {{ d.location }}
            </div>
            <div class="doctor-card__stats">
              <span>Today: <strong>{{ d.visitsToday }} visits</strong></span>
              <span>Rating: <strong>{{ d.rating }}</strong></span>
            </div>
            <div class="doctor-card__actions">
              <label class="doctor-card__status-field" (click)="$event.stopPropagation()">
                <span>Status</span>
                <app-vos-select
                  [options]="doctorStatusPickerOptions"
                  panelTitle="Status"
                  placeholder="Select status"
                  [ngModel]="d.status"
                  (ngModelChange)="updateDoctorStatus(d, $event)"
                />
              </label>
              <button
                type="button"
                class="btn-outline"
                (click)="openProfile(d); $event.stopPropagation()"
              >
                View Profile
              </button>
            </div>
          </article>
        }
      </div>
    </div>

    @if (addDoctorOpen()) {
      <div class="modal-backdrop" (click)="closeAddDoctor()"></div>
        <div class="doctor-modal" role="dialog" aria-labelledby="doctor-modal-title" (mousedown)="$event.stopPropagation()">
        <header class="doctor-modal__header">
          <div>
            <h2 id="doctor-modal-title">Add New Doctor</h2>
            <p>Enter doctor profile details to add them to the team</p>
          </div>
          <button type="button" class="doctor-modal__close" (click)="closeAddDoctor()" aria-label="Close">
            <app-icon name="close" size="md" />
          </button>
        </header>

        <div class="doctor-modal__body">
          @if (formError()) {
            <div class="doctor-modal__error">{{ formError() }}</div>
          }
          <div class="doctor-form-grid">
            <label class="form-field">
              <span>Full Name *</span>
              <input
                type="text"
                name="doctorName"
                placeholder="e.g. Anita Rao"
                [(ngModel)]="doctorForm.name"
              />
            </label>
            <label class="form-field">
              <span>Specialty *</span>
              <app-vos-select
                [options]="specialtyOptions"
                panelTitle="Specialty"
                placeholder="Select specialty"
                [(ngModel)]="doctorForm.specialty"
                name="doctorSpecialty"
              />
            </label>
            <label class="form-field">
              <span>Status</span>
              <app-vos-select
                [options]="doctorStatusPickerOptions"
                panelTitle="Status"
                placeholder="Select status"
                [(ngModel)]="doctorForm.status"
                name="doctorStatus"
              />
            </label>
            <label class="form-field">
              <span>Location *</span>
              <input
                type="text"
                name="doctorLocation"
                placeholder="e.g. Downtown"
                [(ngModel)]="doctorForm.location"
              />
            </label>
            <label class="form-field">
              <span>Mobile Number</span>
              <input
                type="tel"
                name="doctorMobile"
                placeholder="e.g. +1 555 0100"
                [(ngModel)]="doctorForm.mobile"
              />
            </label>
            <label class="form-field">
              <span>Email</span>
              <input
                type="email"
                name="doctorEmail"
                placeholder="doctor@vetonspot.com"
                [(ngModel)]="doctorForm.email"
              />
            </label>
            <label class="form-field">
              <span>Rating (1–5)</span>
              <input
                type="number"
                name="doctorRating"
                min="1"
                max="5"
                step="0.1"
                [(ngModel)]="doctorForm.rating"
              />
            </label>
          </div>
        </div>

        <footer class="doctor-modal__footer">
          <button type="button" class="btn-outline" (click)="closeAddDoctor()">Cancel</button>
          <button type="button" class="btn-primary" (click)="saveDoctor($event)">Add Doctor</button>
        </footer>
      </div>
    }
  `,
})
export class DoctorsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly doctorApi = inject(DoctorApiService);

  readonly filters: { key: DoctorFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'available', label: 'Available' },
    { key: 'on-visit', label: 'On Visit' },
    { key: 'offline', label: 'Offline' },
  ];

  readonly specialties = DOCTOR_SPECIALTIES;
  readonly specialtyOptions = toPickerOptions([...DOCTOR_SPECIALTIES], 'Select specialty');
  readonly doctorStatusPickerOptions = DOCTOR_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
  readonly activeFilter = signal<DoctorFilter>('all');
  readonly doctorsList = signal<Doctor[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly addDoctorOpen = signal(false);
  readonly formError = signal('');
  doctorForm: DoctorForm = createEmptyDoctorForm();
  readonly statusLabel = getDoctorStatusLabel;

  readonly filteredDoctors = computed(() => {
    const filter = this.activeFilter();
    const list = this.doctorsList();
    if (filter === 'all') return list;
    return list.filter((d) => d.status === filter);
  });

  ngOnInit(): void {
    void this.loadDoctors();
  }

  async loadDoctors(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      this.doctorsList.set(await firstValueFrom(this.doctorApi.list()));
    } catch {
      this.loadError.set('Could not load doctors from the server.');
      this.doctorsList.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  openProfile(d: Doctor): void {
    void this.router.navigate(['/doctors', d.id]);
  }

  openAddDoctor(): void {
    this.doctorForm = createEmptyDoctorForm();
    this.formError.set('');
    this.addDoctorOpen.set(true);
  }

  closeAddDoctor(): void {
    this.addDoctorOpen.set(false);
    this.formError.set('');
  }

  saveDoctor(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.doctorForm.name.trim()) {
      this.formError.set('Please enter the doctor full name.');
      return;
    }
    if (!this.doctorForm.specialty) {
      this.formError.set('Please select a specialty.');
      return;
    }
    if (!this.doctorForm.location.trim()) {
      this.formError.set('Please enter a location.');
      return;
    }
    if (!this.doctorForm.status) {
      this.formError.set('Please select a status.');
      return;
    }

    void this.createDoctor();
  }

  private async createDoctor(): Promise<void> {
    try {
      const payload: DoctorForm = { ...this.doctorForm };
      const doctor = await firstValueFrom(this.doctorApi.create(payload));
      await this.loadDoctors();
      this.activeFilter.set('all');
      this.formError.set('');
      this.addDoctorOpen.set(false);
      void this.router.navigate(['/doctors', doctor.id]);
    } catch {
      this.formError.set('Could not save doctor. Please try again.');
    }
  }

  updateDoctorStatus(doctor: Doctor, status: DoctorStatus): void {
    if (!status || status === doctor.status) return;
    void this.saveDoctorStatus(doctor.id, status);
  }

  private async saveDoctorStatus(id: string, status: DoctorStatus): Promise<void> {
    try {
      const updated = await firstValueFrom(this.doctorApi.setAvailability(id, status));
      this.doctorsList.update((list) => list.map((d) => (d.id === id ? updated : d)));
    } catch {
      await this.loadDoctors();
    }
  }
}
