import { Component, computed, effect, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Booking, BookingType, BOOKING_PAYMENT_STATUS_OPTIONS, BOOKING_STATUS_OPTIONS } from '../../models/booking.model';
import {
  formatDoctorVisitLabel,
  formatSubmittedLabel,
  getBookingSubmittedAt,
  getPaymentStatusClass,
  getPaymentStatusLabel,
  getStatusLabel,
} from '../../utils/booking.utils';
import { AppointmentService } from '../../services/appointment.service';
import { BookingApiService } from '../../services/booking-api.service';
import { IconComponent } from '../../components/icon/icon.component';
import { VosSelectComponent } from '../../components/picker/vos-select.component';

function sortBookingsForDisplay(list: Booking[]): Booking[] {
  return [...list].sort((a, b) => {
    if (a.isEmergency && !b.isEmergency) return -1;
    if (!a.isEmergency && b.isEmergency) return 1;
    return getBookingSubmittedAt(b).localeCompare(getBookingSubmittedAt(a));
  });
}

type StatusFilter = 'all' | 'pending' | 'accepted' | 'completed' | 'cancelled';
type TypeFilter = 'all' | BookingType;

@Component({
  selector: 'app-bookings',
  imports: [FormsModule, IconComponent, VosSelectComponent],
  template: `
    <div class="bookings-page" [class.bookings-page--drawer-open]="!!selectedBooking()">
      <div class="bookings-page__header">
        <div class="page-header">
          <h1>Bookings Workspace</h1>
          <p>Manage home visits, online consults, and clinic appointments.</p>
        </div>
        <button type="button" class="btn-primary bookings-page__new-btn" (click)="openAddAppointment()">
          <app-icon name="plus" size="sm" /> New Appointment
        </button>
      </div>

      <div class="bookings-type-tabs" role="tablist" aria-label="Visit type">
        @for (tab of typeTabs; track tab.value) {
          <button
            type="button"
            role="tab"
            class="bookings-type-tabs__btn"
            [class.bookings-type-tabs__btn--active]="typeFilter() === tab.value"
            (click)="onTypeFilterChange(tab.value)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      <div class="bookings-workspace">
        <div class="bookings-table-card">
          <div class="bookings-toolbar">
            <label class="bookings-toolbar__search">
              <app-icon name="search" size="sm" />
              <input
                type="search"
                placeholder="Search pet, owner, or ID..."
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchChange($event)"
              />
            </label>
            <div class="bookings-status-chips">
              @for (chip of statusChips(); track chip.value) {
                <button
                  type="button"
                  class="bookings-status-chips__btn"
                  [class.bookings-status-chips__btn--active]="statusFilter() === chip.value"
                  (click)="onStatusFilterChange(chip.value)"
                >
                  {{ chip.label }} ({{ chip.count }})
                </button>
              }
            </div>
          </div>

          <div class="bookings-table-wrap">
            <table class="bookings-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Submitted</th>
                  <th>Doctor Visit</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Doctor</th>
                  <th class="bookings-table__actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (b of paginatedBookings(); track b.id) {
                  <tr
                    class="bookings-table__row"
                    [class.bookings-table__row--active]="selectedBooking()?.id === b.id"
                    [class.bookings-table__row--emergency]="b.isEmergency"
                    (click)="openBooking(b)"
                  >
                    <td class="bookings-table__id">{{ b.id }}</td>
                    <td>
                      <div class="bookings-table__title-cell">
                        <strong>{{ b.petName }} — {{ b.customerName }}</strong>
                        <span>{{ b.service }}</span>
                        @if (b.isEmergency) {
                          <em class="bookings-table__emg">Emergency</em>
                        }
                      </div>
                    </td>
                    <td><span class="bookings-table__submitted">{{ formatSubmittedLabel(b) }}</span></td>
                    <td><span class="bookings-table__visit">{{ formatDoctorVisitLabel(b) }}</span></td>
                    <td>
                      <span class="bookings-type-pill bookings-type-pill--{{ b.type }}">
                        {{ typeLabel(b.type) }}
                      </span>
                    </td>
                    <td>
                      <span class="status-pill status-pill--{{ b.status }}">{{ statusLabel(b.status) }}</span>
                    </td>
                    <td>
                      <span class="status-pill status-pill--{{ paymentStatusClass(b.paymentStatus) }}">
                        {{ paymentStatusLabel(b.paymentStatus) }}
                      </span>
                    </td>
                    <td>
                      @if (b.assignedDoctor) {
                        <span class="bookings-table__doctor">{{ b.assignedDoctor }}</span>
                      } @else {
                        <span class="bookings-table__doctor bookings-table__doctor--empty">—</span>
                      }
                    </td>
                    <td class="bookings-table__actions-col" (click)="$event.stopPropagation()">
                      <button type="button" class="bookings-table__open-btn" (click)="openBooking(b)">
                        View
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="bookings-table__empty">No bookings match your search</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <footer class="bookings-pagination">
            <span class="bookings-pagination__range">{{ paginationLabel() }}</span>
            <div class="bookings-pagination__nav">
              <button
                type="button"
                class="bookings-pagination__btn"
                [disabled]="currentPage() === 0"
                aria-label="Previous page"
                (click)="prevPage()"
              >
                <app-icon name="arrow-left" size="sm" />
              </button>
              <button
                type="button"
                class="bookings-pagination__btn"
                [disabled]="currentPage() >= totalPages() - 1"
                aria-label="Next page"
                (click)="nextPage()"
              >
                <app-icon name="arrow-right" size="sm" />
              </button>
            </div>
          </footer>
        </div>

        @if (selectedBooking(); as b) {
          <div class="bookings-drawer-overlay" (click)="closeDrawer()"></div>
          <aside class="bookings-drawer" role="dialog" aria-labelledby="booking-drawer-title">
            <header class="bookings-drawer__head">
              <div>
                <span class="bookings-type-pill bookings-type-pill--{{ b.type }}">{{ typeLabel(b.type) }}</span>
                <h2 id="booking-drawer-title">Booking Details</h2>
              </div>
              <button type="button" class="bookings-drawer__close" aria-label="Close" (click)="closeDrawer()">
                <app-icon name="close" size="sm" />
              </button>
            </header>

            <div class="bookings-drawer__body">
              <div class="bookings-drawer__field">
                <label>Booking ID</label>
                <span>{{ b.id }}</span>
              </div>
              <div class="bookings-drawer__grid">
                <div class="bookings-drawer__field">
                  <label>Pet</label>
                  <span>{{ b.petName }} · {{ b.petAge }}</span>
                </div>
                <div class="bookings-drawer__field">
                  <label>Owner</label>
                  <span>{{ b.customerName }}</span>
                </div>
              </div>
              <div class="bookings-drawer__grid">
                <div class="bookings-drawer__field">
                  <label>Service</label>
                  <span>{{ b.service }}</span>
                </div>
                <div class="bookings-drawer__field">
                  <label>Status</label>
                  <span>{{ statusLabel(b.status) }}</span>
                </div>
              </div>
              <div class="bookings-drawer__status-controls">
                <label class="bookings-drawer__field">
                  <span>Change booking status</span>
                  <app-vos-select
                    [options]="bookingStatusOptions"
                    panelTitle="Booking status"
                    placeholder="Select status"
                    [ngModel]="drawerStatusDraft()"
                    (ngModelChange)="drawerStatusDraft.set($event)"
                  />
                </label>
                <label class="bookings-drawer__field">
                  <span>Change payment status</span>
                  <app-vos-select
                    [options]="paymentStatusOptions"
                    panelTitle="Payment status"
                    placeholder="Select payment status"
                    [ngModel]="drawerPaymentStatusDraft()"
                    (ngModelChange)="drawerPaymentStatusDraft.set($event)"
                  />
                </label>
                @if (drawerStatusError()) {
                  <div class="error-msg">{{ drawerStatusError() }}</div>
                }
                <button
                  type="button"
                  class="btn-outline bookings-drawer__status-btn"
                  [disabled]="drawerStatusSaving()"
                  (click)="saveDrawerStatus(b)"
                >
                  Update Status
                </button>
              </div>
              <div class="bookings-drawer__field">
                <label>Reason</label>
                <span>{{ b.reason || '—' }}</span>
              </div>
              <div class="bookings-drawer__grid">
                <div class="bookings-drawer__field">
                  <label>Submitted</label>
                  <span>{{ formatSubmittedLabel(b) }}</span>
                </div>
                <div class="bookings-drawer__field">
                  <label>Doctor Visit</label>
                  <span>{{ formatDoctorVisitLabel(b) }}</span>
                </div>
              </div>
              <div class="bookings-drawer__field">
                <label>Location</label>
                <span>{{ b.location }}</span>
              </div>
              <div class="bookings-drawer__field">
                <label>Assigned Doctor</label>
                <span>{{ b.assignedDoctor || 'Unassigned' }}</span>
              </div>
              @if (b.isEmergency) {
                <div class="bookings-drawer__alert">
                  <app-icon name="alert" size="sm" /> Emergency booking — prioritize assignment
                </div>
              }
            </div>

            <footer class="bookings-drawer__foot">
              <button type="button" class="btn-primary bookings-drawer__primary" (click)="editBooking(b)">
                <app-icon name="edit" size="sm" /> Edit Appointment
              </button>
              <button type="button" class="btn-outline bookings-drawer__secondary" (click)="openFullDetails(b)">
                View Full Record
              </button>
            </footer>
          </aside>
        }
      </div>
    </div>
  `,
})
export class BookingsComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly bookingApi = inject(BookingApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly allBookings = signal<Booking[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly typeTabs: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All Visits' },
    { value: 'home', label: 'Home Visits' },
    { value: 'online', label: 'Online Consults' },
    { value: 'clinic', label: 'Clinic' },
  ];

  readonly statusFilter = signal<StatusFilter>('all');
  readonly typeFilter = signal<TypeFilter>('all');
  readonly searchQuery = signal('');
  readonly pageSize = signal(10);
  readonly currentPage = signal(0);
  readonly selectedBooking = signal<Booking | null>(null);
  readonly drawerStatusDraft = signal<Booking['status']>('pending');
  readonly drawerPaymentStatusDraft = signal<Booking['paymentStatus']>('unpaid');
  readonly drawerStatusSaving = signal(false);
  readonly drawerStatusError = signal('');

  readonly bookingStatusOptions = BOOKING_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
  readonly paymentStatusOptions = BOOKING_PAYMENT_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

  readonly statusLabel = getStatusLabel;
  readonly paymentStatusLabel = getPaymentStatusLabel;
  readonly paymentStatusClass = getPaymentStatusClass;
  readonly formatSubmittedLabel = formatSubmittedLabel;
  readonly formatDoctorVisitLabel = formatDoctorVisitLabel;

  readonly statusChips = computed(() => {
    const type = this.typeFilter();
    const q = this.searchQuery().trim().toLowerCase();
    let list = [...this.allBookings()];
    if (type !== 'all') list = list.filter((b) => b.type === type);
    if (q) {
      list = list.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.petName.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.service.toLowerCase().includes(q) ||
          b.location.toLowerCase().includes(q),
      );
    }
    const count = (status: StatusFilter) =>
      status === 'all' ? list.length : list.filter((b) => b.status === status).length;
    return [
      { value: 'all' as StatusFilter, label: 'All Statuses', count: count('all') },
      { value: 'pending' as StatusFilter, label: 'Pending', count: count('pending') },
      { value: 'accepted' as StatusFilter, label: 'Accepted', count: count('accepted') },
      { value: 'completed' as StatusFilter, label: 'Completed', count: count('completed') },
      { value: 'cancelled' as StatusFilter, label: 'Cancelled', count: count('cancelled') },
    ];
  });

  readonly filteredBookings = computed(() => {
    const status = this.statusFilter();
    const type = this.typeFilter();
    const q = this.searchQuery().trim().toLowerCase();

    let list = [...this.allBookings()];
    if (status !== 'all') list = list.filter((b) => b.status === status);
    if (type !== 'all') list = list.filter((b) => b.type === type);
    list = sortBookingsForDisplay(list);
    if (!q) return list;

    return list.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.petName.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.service.toLowerCase().includes(q) ||
        b.reason.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        (b.assignedDoctor?.toLowerCase().includes(q) ?? false),
    );
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredBookings().length / this.pageSize())),
  );

  readonly paginatedBookings = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.filteredBookings().slice(start, start + this.pageSize());
  });

  readonly paginationLabel = computed(() => {
    const total = this.filteredBookings().length;
    if (total === 0) return '0 of 0';
    const start = this.currentPage() * this.pageSize() + 1;
    const end = Math.min(start + this.pageSize() - 1, total);
    return `${start} – ${end} of ${total}`;
  });

  constructor() {
    effect(() => {
      const version = this.appointmentService.bookingsVersion();
      if (version > 0) void this.loadBookings();
    });
  }

  ngOnInit(): void {
    void this.loadBookings();
    this.route.queryParamMap.subscribe((params) => {
      const status = params.get('status') as StatusFilter | null;
      if (status && ['all', 'pending', 'accepted', 'completed', 'cancelled'].includes(status)) {
        this.statusFilter.set(status);
      }
      const type = params.get('type') as TypeFilter | null;
      if (type && ['all', 'online', 'home', 'clinic'].includes(type)) {
        this.typeFilter.set(type);
      }
    });
  }

  async loadBookings(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const list = await firstValueFrom(this.bookingApi.list({ limit: 100 }));
      this.allBookings.set(list);
    } catch {
      this.loadError.set('Could not load bookings from the server.');
      this.allBookings.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeDrawer();
  }

  typeLabel(type: Booking['type']): string {
    if (type === 'online') return 'Online';
    if (type === 'clinic') return 'Clinic';
    return 'Home';
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(0);
  }

  onStatusFilterChange(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.currentPage.set(0);
    this.syncUrl();
  }

  onTypeFilterChange(value: TypeFilter): void {
    this.typeFilter.set(value);
    this.currentPage.set(0);
    this.syncUrl();
  }

  prevPage(): void {
    if (this.currentPage() > 0) this.currentPage.update((p) => p - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) this.currentPage.update((p) => p + 1);
  }

  openBooking(b: Booking): void {
    this.selectedBooking.set(b);
    this.drawerStatusDraft.set(b.status);
    this.drawerPaymentStatusDraft.set(b.paymentStatus || 'unpaid');
    this.drawerStatusError.set('');
  }

  closeDrawer(): void {
    this.selectedBooking.set(null);
    this.drawerStatusError.set('');
  }

  async saveDrawerStatus(b: Booking): Promise<void> {
    this.drawerStatusSaving.set(true);
    this.drawerStatusError.set('');
    try {
      let updated = b;
      if (this.drawerStatusDraft() !== b.status) {
        updated = await firstValueFrom(this.bookingApi.setStatus(b.id, this.drawerStatusDraft()));
      }
      const currentPayment = updated.paymentStatus || 'unpaid';
      if (this.drawerPaymentStatusDraft() !== currentPayment) {
        updated = await firstValueFrom(
          this.bookingApi.setPaymentStatus(updated.id, this.drawerPaymentStatusDraft()),
        );
      }

      this.selectedBooking.set(updated);
      this.allBookings.update((list) => list.map((item) => (item.id === updated.id ? updated : item)));
      this.appointmentService.bookingsVersion.update((v) => v + 1);
    } catch (error) {
      const err = error as Error;
      this.drawerStatusError.set(err.message || 'Could not update status.');
    } finally {
      this.drawerStatusSaving.set(false);
    }
  }

  editBooking(b: Booking): void {
    this.appointmentService.openEditModal(b, 'bookings');
  }

  openFullDetails(b: Booking): void {
    void this.router.navigate(['/bookings', b.id], {
      queryParams: this.bookingDetailQueryParams(),
    });
  }

  openAddAppointment(): void {
    this.appointmentService.openModal();
  }

  private bookingDetailQueryParams(): Record<string, string> {
    const params: Record<string, string> = { from: 'bookings' };
    if (this.statusFilter() !== 'all') params['status'] = this.statusFilter();
    if (this.typeFilter() !== 'all') params['type'] = this.typeFilter();
    return params;
  }

  private syncUrl(): void {
    const status = this.statusFilter();
    const type = this.typeFilter();
    const nextStatus = status === 'all' ? null : status;
    const nextType = type === 'all' ? null : type;
    const current = this.route.snapshot.queryParamMap;
    if (current.get('status') === nextStatus && current.get('type') === nextType) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: nextStatus, type: nextType, tab: null },
      replaceUrl: true,
    });
  }
}
