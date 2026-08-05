import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Booking, BookingType } from '../../models/booking.model';
import { DoctorProfilePeriod, Doctor, DoctorStatus } from '../../models/doctor.model';
import {
  formatDoctorVisitLabel,
  formatSubmittedLabel,
  getStatusLabel,
} from '../../utils/booking.utils';
import { DoctorApiService, DoctorStats } from '../../services/doctor-api.service';
import { IconComponent } from '../../components/icon/icon.component';
import { DOCTOR_AVAILABILITY_OPTIONS } from '../../components/picker/appointment-picker-options';
import { VosSelectComponent } from '../../components/picker/vos-select.component';

type DoctorProfileTab = 'dashboard' | 'requests' | 'appointments' | 'history';

@Component({
  selector: 'app-doctor-profile',
  imports: [RouterLink, FormsModule, IconComponent, VosSelectComponent],
  template: `
    <div class="doctor-profile-page">
      <button type="button" class="doctor-profile-page__back" (click)="goBack()">
        <app-icon name="arrow-left" size="sm" /> Back
      </button>

      @if (doctor(); as d) {
        <div class="doctor-profile-layout">
          <aside class="doctor-profile-sidebar card">
            <div class="doctor-profile-sidebar__avatar">{{ d.initials }}</div>
            <h1>{{ d.name }}</h1>
            <p class="doctor-profile-sidebar__specialty">{{ d.specialty }}</p>
            <p class="doctor-profile-sidebar__location icon-inline">
              <app-icon name="map-pin" size="sm" /> {{ d.location }}
            </p>
            <div class="doctor-profile-sidebar__rating">
              <app-icon name="star" size="sm" /> {{ d.rating }} rating
            </div>

            <label class="doctor-profile-sidebar__availability">
              <span>Availability</span>
              <app-vos-select
                [options]="availabilityOptions"
                panelTitle="Availability"
                placeholder="Select availability"
                [ngModel]="availabilityValue()"
                (ngModelChange)="onAvailabilityChange($event)"
              />
            </label>

            <nav class="doctor-profile-sidebar__nav">
              <button
                type="button"
                class="doctor-profile-sidebar__nav-item"
                [class.doctor-profile-sidebar__nav-item--active]="activeTab() === 'dashboard'"
                (click)="setTab('dashboard')"
              >
                Dashboard
              </button>
              <button
                type="button"
                class="doctor-profile-sidebar__nav-item"
                [class.doctor-profile-sidebar__nav-item--active]="activeTab() === 'requests'"
                (click)="setTab('requests')"
              >
                Requests
                @if (incomingRequests().length > 0) {
                  <span class="doctor-profile-sidebar__badge">{{ incomingRequests().length }}</span>
                }
              </button>
              <button
                type="button"
                class="doctor-profile-sidebar__nav-item"
                [class.doctor-profile-sidebar__nav-item--active]="activeTab() === 'appointments'"
                (click)="setTab('appointments')"
              >
                Appointments
              </button>
              <button
                type="button"
                class="doctor-profile-sidebar__nav-item"
                [class.doctor-profile-sidebar__nav-item--active]="activeTab() === 'history'"
                (click)="setTab('history')"
              >
                Visit History
              </button>
            </nav>
          </aside>

          <main class="doctor-profile-main">
            @if (activeTab() === 'dashboard') {
            <div class="doctor-profile-stats">
              <article class="doctor-profile-stat card">
                <div class="doctor-profile-stat__icon doctor-profile-stat__icon--blue">
                  <app-icon name="user" size="md" />
                </div>
                <div>
                  <span class="doctor-profile-stat__label">Patients ({{ periodLabel() }})</span>
                  <strong class="doctor-profile-stat__value">{{ periodStats().patients }}</strong>
                </div>
              </article>
              <article class="doctor-profile-stat card">
                <div class="doctor-profile-stat__icon doctor-profile-stat__icon--green">
                  <app-icon name="calendar" size="md" />
                </div>
                <div>
                  <span class="doctor-profile-stat__label">Appointments (This Week)</span>
                  <strong class="doctor-profile-stat__value">{{ weekAppointments() }}</strong>
                </div>
              </article>
              <article class="doctor-profile-stat card">
                <div class="doctor-profile-stat__icon doctor-profile-stat__icon--amber">
                  <app-icon name="clock" size="md" />
                </div>
                <div>
                  <span class="doctor-profile-stat__label">Pending Tasks</span>
                  <strong class="doctor-profile-stat__value">{{ periodStats().pending }}</strong>
                </div>
              </article>
              <article class="doctor-profile-stat card">
                <div class="doctor-profile-stat__icon doctor-profile-stat__icon--teal">
                  <app-icon name="check" size="md" />
                </div>
                <div>
                  <span class="doctor-profile-stat__label">Completed Tasks</span>
                  <strong class="doctor-profile-stat__value">{{ periodStats().completed }}</strong>
                </div>
              </article>
            </div>

            <div class="doctor-profile-period">
              @for (p of periods; track p.key) {
                <button
                  type="button"
                  class="doctor-profile-period__btn"
                  [class.doctor-profile-period__btn--active]="selectedPeriod() === p.key"
                  (click)="selectedPeriod.set(p.key)"
                >
                  {{ p.label }}
                </button>
              }
            </div>
            }

            @if (activeTab() === 'appointments') {
            <div class="doctor-profile-period doctor-profile-period--standalone">
              @for (p of periods; track p.key) {
                <button
                  type="button"
                  class="doctor-profile-period__btn"
                  [class.doctor-profile-period__btn--active]="selectedPeriod() === p.key"
                  (click)="selectedPeriod.set(p.key)"
                >
                  {{ p.label }}
                </button>
              }
            </div>
            }

            @if (activeTab() === 'dashboard' || activeTab() === 'requests') {
            <section class="card doctor-profile-panel">
              <div class="doctor-profile-panel__head">
                <h2>Requests</h2>
                <span class="doctor-profile-panel__hint">Tap a request to review details before accepting</span>
              </div>
              @if (incomingRequests().length > 0) {
                <div class="doctor-request-list">
                  @for (b of incomingRequests(); track b.id) {
                    <div
                      class="doctor-request-list__row"
                      [class.doctor-request-list__row--emergency]="b.isEmergency"
                      role="button"
                      tabindex="0"
                      (click)="viewRequest(b)"
                      (keydown.enter)="viewRequest(b)"
                    >
                      <div class="doctor-request-list__avatar pet-icon-wrap">
                        <app-icon [name]="b.petIcon" size="sm" />
                      </div>
                      <div class="doctor-request-list__info">
                        <strong>{{ b.id }} · {{ b.petName }} — {{ b.customerName }}</strong>
                        <span>{{ b.reason }}</span>
                        <span class="doctor-request-list__meta">
                          {{ formatSubmittedLabel(b) }} · {{ formatDoctorVisitLabel(b) }}
                        </span>
                        @if (b.isEmergency) {
                          <span class="emergency-badge emergency-badge--inline">
                            <app-icon name="alert" size="sm" /> Emergency
                          </span>
                        }
                      </div>
                      <span class="status-pill status-pill--sent">Awaiting response</span>
                      <div class="doctor-request-list__actions" (click)="$event.stopPropagation()">
                        <button
                          type="button"
                          class="doctor-request-list__btn doctor-request-list__btn--accept"
                          aria-label="Accept"
                          (click)="acceptRequest(b)"
                        >
                          <app-icon name="check" size="sm" />
                        </button>
                        <button
                          type="button"
                          class="doctor-request-list__btn doctor-request-list__btn--reject"
                          aria-label="Reject"
                          (click)="rejectRequest(b)"
                        >
                          <app-icon name="close" size="sm" />
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="doctor-profile-panel__empty">No pending requests right now</p>
              }
            </section>
            }

            @if (activeTab() === 'dashboard') {
            <section class="card doctor-profile-panel">
              <div class="doctor-profile-panel__head">
                <h2>Pending Tasks</h2>
                <span class="doctor-profile-panel__hint">{{ periodLabel() }} · accepted, awaiting visit</span>
              </div>
              @if (pendingTasks().length > 0) {
                <div class="doctor-appointment-table-wrap">
                  <table class="data-table doctor-appointment-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Patient</th>
                        <th>Service</th>
                        <th>Scheduled</th>
                        <th>Location</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (b of pendingTasks(); track b.id) {
                        <tr class="doctor-appointment-table__row--clickable" (click)="viewRequest(b)">
                          <td>{{ b.id }}</td>
                          <td>
                            <strong>{{ b.petName }}</strong>
                            <span class="doctor-appointment-table__sub">{{ b.customerName }} · {{ b.petAge }}</span>
                          </td>
                          <td>{{ b.service }}</td>
                          <td>{{ b.scheduledDate }} · {{ b.scheduledTime }}</td>
                          <td>{{ b.area || b.location }}</td>
                          <td>
                            <span class="status-pill status-pill--accepted">{{ statusLabel(b.status) }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="doctor-profile-panel__empty">No pending tasks for {{ periodLabel().toLowerCase() }}</p>
              }
            </section>

            <section class="card doctor-profile-panel">
              <div class="doctor-profile-panel__head">
                <h2>Completed Tasks</h2>
                <span class="doctor-profile-panel__hint">{{ periodLabel() }} · finished visits</span>
              </div>
              @if (completedTasks().length > 0) {
                <div class="doctor-appointment-table-wrap">
                  <table class="data-table doctor-appointment-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Patient</th>
                        <th>Service</th>
                        <th>Completed</th>
                        <th>Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (b of completedTasks(); track b.id) {
                        <tr class="doctor-appointment-table__row--clickable" (click)="viewRequest(b)">
                          <td>{{ b.id }}</td>
                          <td>
                            <strong>{{ b.petName }}</strong>
                            <span class="doctor-appointment-table__sub">{{ b.customerName }}</span>
                          </td>
                          <td>{{ b.service }}</td>
                          <td>{{ b.scheduledDate }} · {{ b.scheduledTime }}</td>
                          <td>{{ b.reason }}</td>
                          <td>
                            <span class="status-pill status-pill--completed">{{ statusLabel(b.status) }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="doctor-profile-panel__empty">No completed tasks for {{ periodLabel().toLowerCase() }}</p>
              }
            </section>
            }

            @if (activeTab() === 'dashboard' || activeTab() === 'appointments') {
            <section class="card doctor-profile-panel">
              <div class="doctor-profile-panel__head">
                <h2>Appointments</h2>
                <span class="doctor-profile-panel__hint">{{ periodLabel() }} · {{ periodAppointments().length }} scheduled</span>
              </div>
              @if (periodAppointments().length > 0) {
                <div class="doctor-appointment-table-wrap">
                  <table class="data-table doctor-appointment-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Patient</th>
                        <th>Visit</th>
                        <th>Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (b of periodAppointments(); track b.id) {
                        <tr class="doctor-appointment-table__row--clickable" (click)="viewRequest(b)">
                          <td>{{ b.id }}</td>
                          <td>
                            <strong>{{ b.petName }}</strong>
                            <span class="doctor-appointment-table__sub">{{ b.customerName }}</span>
                          </td>
                          <td>{{ formatDoctorVisitLabel(b) }}</td>
                          <td>{{ typeLabel(b.type) }}</td>
                          <td>
                            <span class="status-pill status-pill--{{ b.status }}">{{ statusLabel(b.status) }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="doctor-profile-panel__empty">No appointments for {{ periodLabel().toLowerCase() }}</p>
              }
            </section>
            }

            @if (activeTab() === 'history') {
            <section class="card doctor-profile-panel doctor-profile-panel--last">
              <div class="doctor-profile-panel__head">
                <h2>Treated Patients — Full History</h2>
                <span class="doctor-profile-panel__hint">{{ visitHistory().length }} total visits · all time</span>
              </div>
              @if (visitHistory().length > 0) {
                <div class="doctor-appointment-table-wrap">
                  <table class="data-table doctor-appointment-table doctor-history-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Booking</th>
                        <th>Patient / Owner</th>
                        <th>Service</th>
                        <th>Visit Type</th>
                        <th>Location</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (b of visitHistory(); track b.id) {
                        <tr class="doctor-appointment-table__row--clickable" (click)="viewRequest(b)">
                          <td>{{ b.scheduledDate }}<br /><span class="doctor-appointment-table__sub">{{ b.scheduledTime }}</span></td>
                          <td><strong>{{ b.id }}</strong></td>
                          <td>
                            <strong>{{ b.petName }}</strong>
                            <span class="doctor-appointment-table__sub">{{ b.customerName }} · {{ b.petAge }}</span>
                          </td>
                          <td>{{ b.service }}</td>
                          <td>{{ typeLabel(b.type) }}</td>
                          <td>{{ b.area || b.location }}</td>
                          <td class="doctor-history-table__reason">{{ b.reason }}</td>
                          <td>
                            <span class="status-pill status-pill--{{ b.status }}">{{ statusLabel(b.status) }}</span>
                          </td>
                          <td>
                            <button type="button" class="doctor-history-table__view" (click)="viewRequest(b); $event.stopPropagation()">
                              View
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="doctor-profile-panel__empty">No visit history yet</p>
              }
            </section>
            }
          </main>
        </div>
      } @else {
        <div class="card doctor-profile-page__not-found">
          <h2>Doctor not found</h2>
          <a routerLink="/doctors" class="btn-outline">Back to Doctors</a>
        </div>
      }
    </div>
  `,
})
export class DoctorProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly doctorApi = inject(DoctorApiService);

  private readonly doctorId = signal<string | null>(null);
  readonly activeTab = signal<DoctorProfileTab>('dashboard');
  readonly selectedPeriod = signal<DoctorProfilePeriod>('today');

  readonly doctor = signal<Doctor | undefined>(undefined);
  readonly incomingRequests = signal<Booking[]>([]);
  readonly periodStats = signal<DoctorStats>({ total: 0, pending: 0, completed: 0, active: 0, patients: 0 });
  readonly weekAppointments = signal(0);
  readonly periodBookings = signal<Booking[]>([]);
  readonly visitHistory = signal<Booking[]>([]);

  readonly pendingTasks = computed(() => this.periodBookings().filter((b) => b.status === 'accepted'));
  readonly completedTasks = computed(() => this.periodBookings().filter((b) => b.status === 'completed'));
  readonly periodAppointments = computed(() => this.periodBookings());

  readonly periods: { key: DoctorProfilePeriod; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
  ];

  readonly statusLabel = getStatusLabel;
  readonly formatSubmittedLabel = formatSubmittedLabel;
  readonly formatDoctorVisitLabel = formatDoctorVisitLabel;

  readonly availabilityOptions = DOCTOR_AVAILABILITY_OPTIONS;

  readonly availabilityValue = computed(() => this.doctor()?.status ?? 'offline');

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.doctorId.set(id);
      if (id) void this.loadDoctor(id);
      else this.doctor.set(undefined);
    });
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      if (tab === 'requests' || tab === 'appointments' || tab === 'history' || tab === 'dashboard') {
        this.activeTab.set(tab);
      }
    });

    effect(() => {
      const id = this.doctorId();
      const period = this.selectedPeriod();
      if (id && this.doctor()) void this.loadPeriodData(id, period);
    });
  }

  private async loadDoctor(id: string): Promise<void> {
    try {
      const d = await firstValueFrom(this.doctorApi.getById(id));
      this.doctor.set(d);
      await Promise.all([this.loadRequests(id), this.loadVisitHistory(id), this.loadWeekStats(id)]);
    } catch {
      this.doctor.set(undefined);
    }
  }

  private async loadPeriodData(id: string, period: DoctorProfilePeriod): Promise<void> {
    try {
      const [stats, bookings] = await Promise.all([
        firstValueFrom(this.doctorApi.getStats(id, period)),
        firstValueFrom(this.doctorApi.getBookings(id, period)),
      ]);
      this.periodStats.set(stats);
      this.periodBookings.set(bookings);
    } catch {
      this.periodStats.set({ total: 0, pending: 0, completed: 0, active: 0, patients: 0 });
      this.periodBookings.set([]);
    }
  }

  private async loadWeekStats(id: string): Promise<void> {
    try {
      const stats = await firstValueFrom(this.doctorApi.getStats(id, 'weekly'));
      this.weekAppointments.set(stats.total);
    } catch {
      this.weekAppointments.set(0);
    }
  }

  private async loadRequests(id: string): Promise<void> {
    try {
      this.incomingRequests.set(await firstValueFrom(this.doctorApi.getRequests(id)));
    } catch {
      this.incomingRequests.set([]);
    }
  }

  private async loadVisitHistory(id: string): Promise<void> {
    try {
      this.visitHistory.set(await firstValueFrom(this.doctorApi.getBookings(id)));
    } catch {
      this.visitHistory.set([]);
    }
  }

  private async refreshDoctorData(): Promise<void> {
    const id = this.doctorId();
    if (!id) return;
    await Promise.all([
      this.loadDoctor(id),
      this.loadPeriodData(id, this.selectedPeriod()),
      this.loadRequests(id),
      this.loadVisitHistory(id),
    ]);
  }

  setTab(tab: DoctorProfileTab): void {
    this.activeTab.set(tab);
    const id = this.doctorId();
    if (!id) return;
    void this.router.navigate(['/doctors', id], {
      queryParams: tab === 'dashboard' ? {} : { tab },
      replaceUrl: true,
    });
  }

  viewRequest(booking: Booking): void {
    const id = this.doctorId();
    if (!id) return;
    void this.router.navigate(['/bookings', booking.id], {
      queryParams: { from: 'doctor', doctorId: id, tab: this.activeTab() },
    });
  }

  periodLabel(): string {
    const labels: Record<DoctorProfilePeriod, string> = {
      today: 'Today',
      yesterday: 'Yesterday',
      weekly: 'This Week',
      monthly: 'This Month',
    };
    return labels[this.selectedPeriod()];
  }

  typeLabel(type: BookingType): string {
    if (type === 'online') return 'Online';
    if (type === 'clinic') return 'Clinic';
    return 'Home';
  }

  goBack(): void {
    void this.router.navigate(['/doctors']);
  }

  onAvailabilityChange(value: string): void {
    const d = this.doctor();
    const id = this.doctorId();
    if (!d || !id) return;
    void this.updateAvailability(id, value as DoctorStatus);
  }

  private async updateAvailability(id: string, status: DoctorStatus): Promise<void> {
    try {
      const updated = await firstValueFrom(this.doctorApi.setAvailability(id, status));
      this.doctor.set(updated);
    } catch {
      /* keep current selection on failure */
    }
  }

  acceptRequest(booking: Booking): void {
    const id = this.doctorId();
    if (!id) return;
    void this.respondToRequest(booking.id, id, 'accept');
  }

  rejectRequest(booking: Booking): void {
    const id = this.doctorId();
    if (!id) return;
    void this.respondToRequest(booking.id, id, 'decline');
  }

  private async respondToRequest(bookingId: string, doctorId: string, action: 'accept' | 'decline'): Promise<void> {
    try {
      if (action === 'accept') {
        await firstValueFrom(this.doctorApi.acceptRequest(bookingId, doctorId));
      } else {
        await firstValueFrom(this.doctorApi.declineRequest(bookingId, doctorId));
      }
      await this.refreshDoctorData();
    } catch {
      /* request may already be handled */
    }
  }
}
