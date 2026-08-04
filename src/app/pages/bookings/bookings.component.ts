import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BOOKINGS,
  Booking,
  BookingType,
  formatDoctorVisitLabel,
  formatSubmittedLabel,
  getStatusLabel,
  sortBookingsByPriority,
} from '../../data/mock-data';
import { AppointmentService } from '../../services/appointment.service';
import { IconComponent } from '../../components/icon/icon.component';

type StatusFilter = 'all' | 'pending' | 'accepted' | 'completed' | 'cancelled';
type TypeFilter = 'all' | BookingType;

@Component({
  selector: 'app-bookings',
  imports: [FormsModule, IconComponent],
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
                    <td colspan="8" class="bookings-table__empty">No bookings match your search</td>
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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

  readonly statusLabel = getStatusLabel;
  readonly formatSubmittedLabel = formatSubmittedLabel;
  readonly formatDoctorVisitLabel = formatDoctorVisitLabel;

  readonly statusChips = computed(() => {
    this.appointmentService.bookingsVersion();
    const type = this.typeFilter();
    const q = this.searchQuery().trim().toLowerCase();
    let list = [...BOOKINGS];
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
    ];
  });

  readonly filteredBookings = computed(() => {
    this.appointmentService.bookingsVersion();
    const status = this.statusFilter();
    const type = this.typeFilter();
    const q = this.searchQuery().trim().toLowerCase();

    let list = [...BOOKINGS];
    if (status !== 'all') list = list.filter((b) => b.status === status);
    if (type !== 'all') list = list.filter((b) => b.type === type);
    list = sortBookingsByPriority(list);
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

  ngOnInit(): void {
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
  }

  closeDrawer(): void {
    this.selectedBooking.set(null);
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
