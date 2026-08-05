import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Booking, PetMedicationRecord } from '../../models/booking.model';
import {
  formatFileLabel,
  getAcceptanceLabel,
  getEmergencySlaLabel,
  getPaymentStatusClass,
  getPaymentStatusLabel,
  getStatusLabel,
} from '../../utils/booking.utils';
import { AppointmentService } from '../../services/appointment.service';
import { BookingApiService, PetMedicationSummary, PetVisitSummary } from '../../services/booking-api.service';
import { FileApiService, BookingFile } from '../../services/file-api.service';
import { PaymentApiService } from '../../services/payment-api.service';
import { PaymentMethod, PaymentRecord } from '../../models/payment.model';
import { IconComponent } from '../../components/icon/icon.component';
import { getFilledFormDetails, bookingToForm } from '../../models/appointment-form.model';

@Component({
  selector: 'app-booking-detail',
  imports: [RouterLink, IconComponent, FormsModule],
  template: `
    <div class="booking-detail-page">
      <div class="booking-detail-page__top">
        <button type="button" class="booking-detail-page__back" (click)="goBack()">
          <app-icon name="arrow-left" size="sm" /> Back
        </button>
      </div>

      @if (loading()) {
        <div class="card booking-detail-page__not-found">
          <p>Loading booking…</p>
        </div>
      } @else if (booking(); as b) {
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
                <span class="status-pill status-pill--{{ paymentStatusClass(b.paymentStatus) }}">
                  {{ paymentStatusLabel(b.paymentStatus) }}
                </span>
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
            @if (canRecordPayment(b)) {
              <button type="button" class="btn-outline" (click)="openPaymentModal()">Record Payment</button>
            }
            @if (canCancel(b)) {
              <button type="button" class="btn-outline" [disabled]="actionLoading()" (click)="cancelBooking(b)">
                Cancel Booking
              </button>
            }
            @if (canComplete(b)) {
              <button type="button" class="btn-primary" [disabled]="actionLoading()" (click)="completeBooking(b)">
                Mark Completed
              </button>
            }
          </div>
        </div>

        @if (actionError()) {
          <div class="error-msg">{{ actionError() }}</div>
        }

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

            <section class="card booking-detail-page__section">
              <div class="card__header">
                <h3>Uploaded Files</h3>
              </div>
              @if (bookingFiles().length > 0) {
                <div class="booking-detail-page__files">
                  @for (file of bookingFiles(); track file.id) {
                    <a class="booking-detail-page__file-row" [href]="file.url" target="_blank" rel="noopener">
                      <strong>{{ file.fileName }}</strong>
                      <span>{{ file.category }}</span>
                    </a>
                  }
                </div>
              } @else {
                <p class="booking-detail-page__empty">No uploaded files for this booking.</p>
              }
            </section>

            @if (payments().length > 0) {
              <section class="card booking-detail-page__section">
                <div class="card__header">
                  <h3>Payments</h3>
                </div>
                <div class="booking-detail-page__payments">
                  @for (payment of payments(); track payment.id) {
                    <div class="booking-detail-page__payment-row">
                      <strong>INR {{ payment.amount }}</strong>
                      <span>{{ payment.method }} · {{ payment.status }}</span>
                      @if (payment.referenceNote) {
                        <span>{{ payment.referenceNote }}</span>
                      }
                      <em>{{ payment.paidAt || payment.createdAt }}</em>
                    </div>
                  }
                </div>
              </section>
            }

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

      @if (paymentModalOpen()) {
        <div class="booking-detail-page__modal-backdrop" (click)="closePaymentModal()">
          <div class="card booking-detail-page__modal" (click)="$event.stopPropagation()">
            <h3>Record Payment</h3>
            <label class="form-field">
              <span>Amount (INR)</span>
              <input type="number" min="1" step="1" [(ngModel)]="paymentAmount" />
            </label>
            <label class="form-field">
              <span>Method</span>
              <select [(ngModel)]="paymentMethod">
                @for (method of paymentMethods; track method.value) {
                  <option [value]="method.value">{{ method.label }}</option>
                }
              </select>
            </label>
            <label class="form-field form-field--full">
              <span>Reference note</span>
              <input type="text" [(ngModel)]="paymentReferenceNote" placeholder="UPI ref, receipt no, etc." />
            </label>
            @if (paymentError()) {
              <div class="error-msg">{{ paymentError() }}</div>
            }
            <div class="booking-detail-page__modal-actions">
              <button type="button" class="btn-outline" (click)="closePaymentModal()">Cancel</button>
              <button type="button" class="btn-primary" [disabled]="paymentSaving()" (click)="submitPayment()">
                Save Payment
              </button>
            </div>
          </div>
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
  private readonly bookingApi = inject(BookingApiService);
  private readonly fileApi = inject(FileApiService);
  private readonly paymentApi = inject(PaymentApiService);

  readonly statusLabel = getStatusLabel;
  readonly acceptanceLabel = getAcceptanceLabel;
  readonly emergencySlaLabel = getEmergencySlaLabel;
  readonly paymentStatusLabel = getPaymentStatusLabel;
  readonly paymentStatusClass = getPaymentStatusClass;
  readonly formatFileLabel = formatFileLabel;

  readonly paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Cash' },
    { value: 'upi', label: 'UPI' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank transfer' },
    { value: 'other', label: 'Other' },
  ];

  readonly booking = signal<Booking | undefined>(undefined);
  readonly allVisits = signal<Booking[]>([]);
  readonly previousVisits = signal<Booking[]>([]);
  readonly medicationHistory = signal<PetMedicationRecord[]>([]);
  readonly bookingFiles = signal<BookingFile[]>([]);
  readonly payments = signal<PaymentRecord[]>([]);
  readonly loading = signal(true);
  readonly actionLoading = signal(false);
  readonly actionError = signal('');
  readonly paymentModalOpen = signal(false);
  readonly paymentSaving = signal(false);
  readonly paymentError = signal('');

  paymentAmount = 0;
  paymentMethod: PaymentMethod = 'cash';
  paymentReferenceNote = '';

  readonly visitCount = computed(() => this.allVisits().length);

  readonly detailGroups = computed(() => {
    const b = this.booking();
    if (!b) return [];
    return getFilledFormDetails(bookingToForm(b));
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) void this.loadBooking(id);
    });
  }

  async loadBooking(id: string): Promise<void> {
    this.loading.set(true);
    this.actionError.set('');
    this.booking.set(undefined);
    this.allVisits.set([]);
    this.previousVisits.set([]);
    this.medicationHistory.set([]);
    this.bookingFiles.set([]);
    this.payments.set([]);

    try {
      const booking = await firstValueFrom(this.bookingApi.getById(id));
      this.booking.set(booking);

      const [previousPromise, filesPromise, paymentsPromise] = [
        firstValueFrom(this.bookingApi.getPreviousVisits(id)),
        firstValueFrom(this.fileApi.listForBooking(id)),
        firstValueFrom(this.paymentApi.listForBooking(id)),
      ];
      const previousPromiseResult = previousPromise;

      if (booking.ownerId && booking.petId) {
        const [visits, meds, previous, files, paymentList] = await Promise.all([
          firstValueFrom(this.bookingApi.getVisitHistory(booking.ownerId, booking.petId)),
          firstValueFrom(this.bookingApi.getMedicationHistory(booking.ownerId, booking.petId)),
          previousPromiseResult,
          filesPromise,
          paymentsPromise,
        ]);
        this.allVisits.set(this.mapVisitsToBookings(visits, booking));
        this.medicationHistory.set(this.mapMedicationHistory(meds));
        this.previousVisits.set(this.mapVisitsToBookings(previous, booking));
        this.bookingFiles.set(files);
        this.payments.set(paymentList);
      } else {
        const [previous, files, paymentList] = await Promise.all([
          previousPromiseResult,
          filesPromise,
          paymentsPromise,
        ]);
        this.allVisits.set([booking]);
        this.previousVisits.set(this.mapVisitsToBookings(previous, booking));
        this.bookingFiles.set(files);
        this.payments.set(paymentList);
      }
    } catch {
      this.booking.set(undefined);
    } finally {
      this.loading.set(false);
    }
  }

  canCancel(b: Booking): boolean {
    return b.status === 'pending' || b.status === 'sent' || b.status === 'accepted';
  }

  canComplete(b: Booking): boolean {
    return b.status === 'accepted' || b.status === 'sent';
  }

  canRecordPayment(b: Booking): boolean {
    return b.status !== 'cancelled' && b.paymentStatus !== 'paid' && b.paymentStatus !== 'waived';
  }

  openPaymentModal(): void {
    this.paymentAmount = 0;
    this.paymentMethod = 'cash';
    this.paymentReferenceNote = '';
    this.paymentError.set('');
    this.paymentModalOpen.set(true);
  }

  closePaymentModal(): void {
    if (this.paymentSaving()) return;
    this.paymentModalOpen.set(false);
  }

  async submitPayment(): Promise<void> {
    const booking = this.booking();
    if (!booking) return;
    if (!this.paymentAmount || this.paymentAmount <= 0) {
      this.paymentError.set('Enter a valid amount.');
      return;
    }

    this.paymentSaving.set(true);
    this.paymentError.set('');
    try {
      await firstValueFrom(
        this.paymentApi.create({
          bookingId: booking.id,
          amount: this.paymentAmount,
          method: this.paymentMethod,
          referenceNote: this.paymentReferenceNote || undefined,
          status: 'paid',
        }),
      );
      this.paymentModalOpen.set(false);
      await this.loadBooking(booking.id);
      this.appointmentService.bookingsVersion.update((v) => v + 1);
    } catch (error) {
      const err = error as Error;
      this.paymentError.set(err.message || 'Could not record payment.');
    } finally {
      this.paymentSaving.set(false);
    }
  }

  async cancelBooking(b: Booking): Promise<void> {
    this.actionLoading.set(true);
    this.actionError.set('');
    try {
      const updated = await firstValueFrom(this.bookingApi.cancel(b.id));
      this.booking.set(updated);
      this.appointmentService.bookingsVersion.update((v) => v + 1);
    } catch (error) {
      const err = error as Error;
      this.actionError.set(err.message || 'Could not cancel booking.');
    } finally {
      this.actionLoading.set(false);
    }
  }

  async completeBooking(b: Booking): Promise<void> {
    this.actionLoading.set(true);
    this.actionError.set('');
    try {
      const updated = await firstValueFrom(this.bookingApi.complete(b.id));
      this.booking.set(updated);
      this.appointmentService.bookingsVersion.update((v) => v + 1);
    } catch (error) {
      const err = error as Error;
      this.actionError.set(err.message || 'Could not complete booking.');
    } finally {
      this.actionLoading.set(false);
    }
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
          booking: this.route.snapshot.queryParamMap.get('booking') ?? this.booking()?.id,
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

  private mapVisitsToBookings(visits: PetVisitSummary[], current: Booking): Booking[] {
    return visits.map((visit) => ({
      id: visit.displayId || visit.id,
      customerName: current.customerName,
      petName: current.petName,
      petAge: current.petAge,
      petIcon: current.petIcon,
      reason: visit.reason || '',
      service: visit.service || '',
      type: current.type,
      status: (visit.status as Booking['status']) || 'completed',
      location: current.location,
      scheduledDate: visit.scheduledDate || '',
      scheduledTime: visit.scheduledTime || '',
      assignedDoctor: visit.assignedDoctorName || undefined,
      history: [],
      createdAt: visit.scheduledDate || '',
    }));
  }

  private mapMedicationHistory(meds: PetMedicationSummary[]): PetMedicationRecord[] {
    return meds.map((entry) => ({
      bookingId: entry.displayId || entry.bookingId,
      visitDate: entry.scheduledDate || '',
      medicine: entry.medications.medicineName || 'Medication',
      dosage: entry.medications.dosage || '',
      notes: entry.medications.sinceWhen || entry.medications.supplements || undefined,
    }));
  }
}
