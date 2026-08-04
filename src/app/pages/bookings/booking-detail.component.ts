import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import {
  Booking,
  getAcceptanceLabel,
  getBookingById,
  getEmergencySlaLabel,
  getPetMedicationHistory,
  getPetVisitHistory,
  getPreviousPetVisits,
  getStatusLabel,
  PetMedicationRecord,
} from '../../data/mock-data';
import { AppointmentService } from '../../services/appointment.service';
import { IconComponent } from '../../components/icon/icon.component';
import { getFilledFormDetails, bookingToForm } from '../../models/appointment-form.model';

@Component({
  selector: 'app-booking-detail',
  imports: [RouterLink, IconComponent],
  template: `
    <div class="booking-detail-page">
      <div class="booking-detail-page__top">
        <button type="button" class="booking-detail-page__back" (click)="goBack()">
          <app-icon name="arrow-left" size="sm" /> Back
        </button>
      </div>

      @if (booking(); as b) {
        <div class="page-header booking-detail-page__header">
          <div class="booking-detail-page__hero">
            <div class="booking-detail-page__avatar pet-icon-wrap">
              <app-icon [name]="b.petIcon" size="lg" />
            </div>
            <div>
              <h1>
                @if (b.isEmergency) {
                  <span class="emergency-badge emergency-badge--inline">
                    <app-icon name="alert" size="sm" /> Emergency
                  </span>
                }
                {{ b.petName }}
              </h1>
              <p>{{ b.customerName }} · {{ b.id }} · {{ b.petAge }}</p>
              <div class="booking-detail-page__tags">
                <span class="status-pill status-pill--{{ b.status }}">{{ statusLabel(b.status) }}</span>
                <span class="appointment-card__type appointment-card__type--{{ b.type }}">
                  {{ typeLabel(b.type) }}
                </span>
                @if (visitCount() > 1) {
                  <span class="booking-detail-page__visit-badge">
                    {{ visitCount() }} visits on record
                  </span>
                } @else {
                  <span class="booking-detail-page__visit-badge booking-detail-page__visit-badge--new">
                    First visit on record
                  </span>
                }
              </div>
            </div>
          </div>
          <div class="booking-detail-page__actions">
            <button type="button" class="btn-outline" (click)="editBooking(b)">Edit Appointment</button>
          </div>
        </div>

        <div class="booking-detail-page__grid">
          <div class="booking-detail-page__main">
            <section class="card booking-detail-page__section">
              <div class="card__header">
                <h3>Current Booking</h3>
              </div>
              <div class="booking-detail-page__summary-grid">
                <div class="booking-detail-page__field">
                  <label>Service</label>
                  <span>{{ b.service }}</span>
                </div>
                <div class="booking-detail-page__field">
                  <label>Reason</label>
                  <span>{{ b.reason }}</span>
                </div>
                <div class="booking-detail-page__field">
                  <label>Scheduled</label>
                  <span>{{ b.scheduledDate }} at {{ b.scheduledTime }}</span>
                </div>
                <div class="booking-detail-page__field">
                  <label>Location</label>
                  <span>{{ b.location }}</span>
                </div>
                <div class="booking-detail-page__field">
                  <label>Assigned Doctor</label>
                  <span>{{ b.assignedDoctor ?? '—' }}</span>
                </div>
                <div class="booking-detail-page__field">
                  <label>Acceptance</label>
                  <span>{{ acceptanceLabel(b) }}</span>
                </div>
                @if (b.isEmergency) {
                  <div class="booking-detail-page__field booking-detail-page__field--full">
                    <label>Emergency SLA</label>
                    <span class="emergency-sla">{{ emergencySlaLabel(b) }}</span>
                  </div>
                }
              </div>
            </section>

            <section class="card booking-detail-page__section">
              <div class="card__header">
                <h3>Previous Visits</h3>
                <span class="booking-detail-page__count">{{ previousVisits().length }} past</span>
              </div>
              @if (previousVisits().length > 0) {
                <div class="booking-detail-page__visits">
                  @for (visit of previousVisits(); track visit.id) {
                    <a
                      class="booking-detail-page__visit-row"
                      [routerLink]="['/bookings', visit.id]"
                      [queryParams]="visitQueryParams(visit.id)"
                    >
                      <div class="booking-detail-page__visit-date">
                        <strong>{{ visit.scheduledDate }}</strong>
                        <span>{{ visit.scheduledTime }}</span>
                      </div>
                      <div class="booking-detail-page__visit-info">
                        <strong>{{ visit.reason }}</strong>
                        <span>
                          {{ visit.assignedDoctor ?? 'No doctor assigned' }}
                          · {{ statusLabel(visit.status) }}
                        </span>
                      </div>
                      <span class="booking-detail-page__visit-link">View</span>
                    </a>
                  }
                </div>
              } @else {
                <p class="booking-detail-page__empty">No previous visits recorded for {{ b.petName }}.</p>
              }
            </section>

            <section class="card booking-detail-page__section">
              <div class="card__header">
                <h3>Medications & Treatments History</h3>
              </div>
              @if (medicationHistory().length > 0) {
                <div class="booking-detail-page__meds">
                  @for (med of medicationHistory(); track med.bookingId + med.medicine + med.visitDate) {
                    <div class="booking-detail-page__med-row">
                      <div class="booking-detail-page__med-date">{{ med.visitDate }}</div>
                      <div class="booking-detail-page__med-info">
                        <strong>{{ med.medicine }}</strong>
                        <span>{{ med.dosage }}</span>
                        @if (med.doctor) {
                          <span class="booking-detail-page__med-doctor">{{ med.doctor }}</span>
                        }
                        @if (med.notes) {
                          <span class="booking-detail-page__med-notes">{{ med.notes }}</span>
                        }
                      </div>
                      <span class="booking-detail-page__med-ref">{{ med.bookingId }}</span>
                    </div>
                  }
                </div>
              } @else {
                <p class="booking-detail-page__empty">No medication history recorded yet.</p>
              }
            </section>

            @if (detailGroups().length > 0) {
              <section class="card booking-detail-page__section">
                <div class="card__header">
                  <h3>Full Appointment Record</h3>
                  <span class="booking-detail-page__hint">All details saved for this booking</span>
                </div>
                <div class="appointment-full-sheet">
                  @for (group of detailGroups(); track group.section) {
                    <section class="appointment-full-sheet__section">
                      <h4>{{ group.section }}</h4>
                      <table class="appointment-full-sheet__table">
                        <tbody>
                          @for (item of group.items; track item.label) {
                            <tr>
                              <th>{{ item.label }}</th>
                              <td>{{ item.value }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </section>
                  }
                </div>
              </section>
            }
          </div>

          <aside class="booking-detail-page__aside">
            <section class="card booking-detail-page__section">
              <div class="card__header">
                <h3>All Visits Timeline</h3>
              </div>
              <ul class="booking-detail-page__timeline">
                @for (visit of allVisits(); track visit.id) {
                  <li
                    class="booking-detail-page__timeline-item"
                    [class.booking-detail-page__timeline-item--current]="visit.id === b.id"
                  >
                    <a [routerLink]="['/bookings', visit.id]" [queryParams]="visitQueryParams(visit.id)">
                      <strong>{{ visit.scheduledDate }}</strong>
                      <span>{{ visit.reason }}</span>
                      <span class="status-pill status-pill--{{ visit.status }}">
                        {{ statusLabel(visit.status) }}
                      </span>
                    </a>
                  </li>
                }
              </ul>
            </section>

            <section class="card booking-detail-page__section">
              <div class="card__header">
                <h3>Activity History</h3>
              </div>
              <ul class="timeline">
                @for (e of b.history; track e.time + e.label) {
                  <li [class.pending]="!e.done">
                    <strong>{{ e.time }}</strong> — {{ e.label }}
                  </li>
                }
              </ul>
            </section>
          </aside>
        </div>
      } @else {
        <div class="card booking-detail-page__not-found">
          <h2>Booking not found</h2>
          <p>The booking you are looking for does not exist or was removed.</p>
          <button type="button" class="btn-primary" (click)="goBack()">Go Back</button>
        </div>
      }
    </div>
  `,
})
export class BookingDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly appointmentService = inject(AppointmentService);

  readonly statusLabel = getStatusLabel;
  readonly acceptanceLabel = getAcceptanceLabel;
  readonly emergencySlaLabel = getEmergencySlaLabel;

  private readonly bookingId = signal<string | null>(null);

  readonly booking = computed(() => {
    this.appointmentService.bookingsVersion();
    const id = this.bookingId();
    if (!id) return undefined;
    return getBookingById(id);
  });

  readonly allVisits = computed(() => {
    const b = this.booking();
    if (!b) return [];
    return getPetVisitHistory(b);
  });

  readonly previousVisits = computed(() => {
    const b = this.booking();
    if (!b) return [];
    return getPreviousPetVisits(b);
  });

  readonly visitCount = computed(() => this.allVisits().length);

  readonly medicationHistory = computed((): PetMedicationRecord[] => {
    const b = this.booking();
    if (!b) return [];
    return getPetMedicationHistory(b);
  });

  readonly detailGroups = computed(() => {
    const b = this.booking();
    if (!b) return [];
    return getFilledFormDetails(bookingToForm(b));
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      this.bookingId.set(params.get('id'));
    });
  }

  typeLabel(type: Booking['type']): string {
    if (type === 'online') return 'Online';
    if (type === 'clinic') return 'Clinic';
    return 'Home';
  }

  editBooking(b: Booking): void {
    const from = this.route.snapshot.queryParamMap.get('from');
    this.appointmentService.openEditModal(b, from === 'bookings' ? 'bookings' : 'dashboard');
  }

  visitQueryParams(visitId: string): Record<string, string> {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'calendar') {
      return {
        from: 'calendar',
        date: this.route.snapshot.queryParamMap.get('date') ?? '',
        booking: visitId,
      };
    }
    if (from === 'bookings') {
      const status = this.route.snapshot.queryParamMap.get('status');
      const type = this.route.snapshot.queryParamMap.get('type');
      const tab = this.route.snapshot.queryParamMap.get('tab');
      const params: Record<string, string> = { from: 'bookings' };
      if (status) params['status'] = status;
      if (type) params['type'] = type;
      if (!status && tab) params['tab'] = tab;
      return params;
    }
    return {};
  }

  goBack(): void {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'calendar') {
      void this.router.navigate(['/calendar'], {
        queryParams: {
          date: this.route.snapshot.queryParamMap.get('date'),
          booking: this.route.snapshot.queryParamMap.get('booking') ?? this.bookingId(),
        },
      });
      return;
    }
    if (from === 'bookings') {
      const status = this.route.snapshot.queryParamMap.get('status');
      const type = this.route.snapshot.queryParamMap.get('type');
      const tab = this.route.snapshot.queryParamMap.get('tab');
      const queryParams: Record<string, string> = {};
      if (status) queryParams['status'] = status;
      if (type) queryParams['type'] = type;
      if (!status && tab) queryParams['tab'] = tab;
      void this.router.navigate(['/bookings'], {
        queryParams: Object.keys(queryParams).length ? queryParams : {},
      });
      return;
    }
    if (from === 'doctor') {
      const doctorId = this.route.snapshot.queryParamMap.get('doctorId');
      const tab = this.route.snapshot.queryParamMap.get('tab');
      if (doctorId) {
        void this.router.navigate(['/doctors', doctorId], {
          queryParams: tab && tab !== 'dashboard' ? { tab } : {},
        });
        return;
      }
    }
    this.location.back();
  }
}
