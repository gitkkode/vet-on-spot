import { Component, computed, effect, HostListener, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Booking } from '../../models/booking.model';
import {
  getAcceptanceLabel,
  getEmergencySlaLabel,
  getStatusLabel,
  sortBookingsByPriority,
} from '../../utils/booking.utils';
import { BookingApiService } from '../../services/booking-api.service';
import { IconComponent } from '../../components/icon/icon.component';

interface CalendarDay {
  date: Date;
  iso: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  bookingCount: number;
  hasEmergency: boolean;
}

@Component({
  selector: 'app-calendar',
  imports: [IconComponent, RouterLink],
  template: `
    <div class="calendar-page">
      <div class="page-header">
        <h1>Calendar</h1>
        <p>View bookings by date — click a day to open the schedule dossier</p>
      </div>

      <div class="calendar-view">
        <div class="calendar-view__head">
          <div>
            <h2>Booking Schedule</h2>
            <p>Click a date to view all bookings and acceptance status</p>
          </div>
          <div class="calendar-view__nav">
            <button type="button" class="calendar-view__nav-btn" (click)="prevMonth()" aria-label="Previous month">
              ‹
            </button>
            <span class="calendar-view__month">{{ monthLabel() }}</span>
            <button type="button" class="calendar-view__nav-btn" (click)="nextMonth()" aria-label="Next month">
              ›
            </button>
          </div>
        </div>

        <div class="calendar-view__grid-wrap">
          <div class="calendar-view__weekdays">
            @for (day of weekdays; track day) {
              <span>{{ day }}</span>
            }
          </div>
          <div class="calendar-view__grid">
            @for (cell of calendarDays(); track cell.iso) {
              <button
                type="button"
                class="calendar-view__day"
                [class.calendar-view__day--outside]="!cell.isCurrentMonth"
                [class.calendar-view__day--today]="cell.isToday"
                [class.calendar-view__day--selected]="drawerOpen() && selectedDate() === cell.iso"
                [class.calendar-view__day--has-bookings]="cell.bookingCount > 0"
                [class.calendar-view__day--has-emergency]="cell.hasEmergency"
                (click)="selectDate(cell.iso)"
              >
                <span class="calendar-view__day-num">{{ cell.day }}</span>
                @if (cell.bookingCount > 0) {
                  <span class="calendar-view__day-dots">
                    @for (dot of dotArray(cell.bookingCount); track $index) {
                      <span class="calendar-view__dot"></span>
                    }
                  </span>
                }
              </button>
            }
          </div>
        </div>
      </div>

      @if (drawerOpen()) {
        <div class="calendar-drawer-overlay" (click)="closeDrawer()"></div>
        <aside class="calendar-drawer" role="dialog" aria-labelledby="calendar-drawer-title">
          <header class="calendar-drawer__head">
            <div>
              <span class="calendar-drawer__badge">Schedule</span>
              <h2 id="calendar-drawer-title">Day Dossier</h2>
              <p class="calendar-drawer__subtitle">{{ selectedDateLabel() }}</p>
            </div>
            <button type="button" class="calendar-drawer__close" aria-label="Close" (click)="closeDrawer()">
              <app-icon name="close" size="sm" />
            </button>
          </header>

          <div class="calendar-drawer__meta">
            <div class="calendar-drawer__field">
              <label>Date</label>
              <span>{{ selectedDateLabel() }}</span>
            </div>
            <div class="calendar-drawer__field">
              <label>Bookings</label>
              <span>{{ dayBookings().length }} scheduled</span>
            </div>
          </div>

          <div class="calendar-drawer__body">
            @if (dayLoading()) {
              <p class="calendar-drawer__empty">Loading bookings…</p>
            } @else if (dayBookings().length > 0) {
              <div class="calendar-drawer__list">
                @for (b of dayBookings(); track b.id) {
                  <article
                    class="calendar-booking-card"
                    [class.calendar-booking-card--selected]="selectedBooking()?.id === b.id"
                    [class.calendar-booking-card--emergency]="b.isEmergency"
                    (click)="selectBooking(b)"
                  >
                    @if (b.isEmergency) {
                      <span class="emergency-badge emergency-badge--compact">
                        <app-icon name="alert" size="sm" /> Emergency
                      </span>
                    }
                    <div class="calendar-booking-card__top">
                      <div class="calendar-booking-card__pet">
                        <span class="pet-icon-wrap"><app-icon [name]="b.petIcon" size="sm" /></span>
                        <div>
                          <strong>{{ b.petName }}</strong>
                          <span>{{ b.customerName }}</span>
                        </div>
                      </div>
                      <span class="status-pill status-pill--{{ b.status }}">{{ statusLabel(b.status) }}</span>
                    </div>
                    <div class="calendar-booking-card__meta">
                      <span class="icon-inline"><app-icon name="clock" size="sm" /> {{ formatTime(b.scheduledTime) }}</span>
                      <span class="icon-inline">
                        <app-icon [name]="b.type === 'online' ? 'monitor' : 'home'" size="sm" />
                        {{ b.type === 'online' ? 'Online' : 'Home' }}
                      </span>
                      <span>{{ b.service }}</span>
                    </div>
                    @if (b.isEmergency) {
                      <div class="emergency-sla emergency-sla--compact">{{ emergencySlaLabel(b) }}</div>
                    }
                    <div
                      class="calendar-booking-card__acceptance"
                      [class.calendar-booking-card__acceptance--pending]="!b.assignedDoctor && b.status !== 'cancelled'"
                      [class.calendar-booking-card__acceptance--accepted]="!!b.assignedDoctor"
                    >
                      {{ acceptanceLabel(b) }}
                    </div>
                  </article>
                }
              </div>

              @if (selectedBooking(); as b) {
                <div class="calendar-drawer__dossier">
                  <div class="calendar-drawer__field">
                    <label>Booking ID</label>
                    <span>{{ b.id }}</span>
                  </div>
                  <div class="calendar-drawer__grid">
                    <div class="calendar-drawer__field">
                      <label>Pet</label>
                      <span>{{ b.petName }} · {{ b.petAge }}</span>
                    </div>
                    <div class="calendar-drawer__field">
                      <label>Owner</label>
                      <span>{{ b.customerName }}</span>
                    </div>
                  </div>
                  <div class="calendar-drawer__grid">
                    <div class="calendar-drawer__field">
                      <label>Service</label>
                      <span>{{ b.service }}</span>
                    </div>
                    <div class="calendar-drawer__field">
                      <label>Status</label>
                      <span>{{ statusLabel(b.status) }}</span>
                    </div>
                  </div>
                  <div class="calendar-drawer__field">
                    <label>Reason</label>
                    <span>{{ b.reason || '—' }}</span>
                  </div>
                  <div class="calendar-drawer__grid">
                    <div class="calendar-drawer__field">
                      <label>Time</label>
                      <span>{{ formatTime(b.scheduledTime) }}</span>
                    </div>
                    <div class="calendar-drawer__field">
                      <label>Location</label>
                      <span>{{ b.location }}</span>
                    </div>
                  </div>
                  <div class="calendar-drawer__field">
                    <label>Doctor Acceptance</label>
                    <span>{{ acceptanceLabel(b) }}</span>
                  </div>
                  @if (b.isEmergency) {
                    <div class="calendar-drawer__alert">
                      <app-icon name="alert" size="sm" /> {{ emergencySlaLabel(b) }}
                    </div>
                  }
                </div>
              }
            } @else {
              <div class="calendar-drawer__empty">
                <app-icon name="calendar" size="lg" />
                <p>No bookings on this date</p>
              </div>
            }
          </div>

          @if (selectedBooking(); as b) {
            <footer class="calendar-drawer__foot">
              <a
                [routerLink]="['/bookings', b.id]"
                [queryParams]="detailQueryParams(b.id)"
                class="btn-primary calendar-drawer__primary"
              >
                <app-icon name="arrow-right" size="sm" /> View Full Profile
              </a>
              <button type="button" class="btn-outline calendar-drawer__secondary" (click)="closeDrawer()">
                Close Dossier
              </button>
            </footer>
          }
        </aside>
      }
    </div>
  `,
})
export class CalendarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly bookingApi = inject(BookingApiService);

  readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  readonly calendarMonth = signal(this.startOfMonth(new Date()));
  readonly selectedDate = signal(this.toIso(new Date()));
  readonly selectedBooking = signal<Booking | null>(null);
  readonly drawerOpen = signal(false);
  readonly dayBookings = signal<Booking[]>([]);
  readonly dayLoading = signal(false);
  private readonly monthSummary = signal<Record<string, { count: number; hasEmergency: boolean }>>({});

  readonly statusLabel = getStatusLabel;
  readonly acceptanceLabel = getAcceptanceLabel;
  readonly emergencySlaLabel = getEmergencySlaLabel;

  readonly monthLabel = computed(() =>
    this.calendarMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  );

  readonly calendarDays = computed((): CalendarDay[] => {
    const month = this.calendarMonth();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const startOffset = firstDay.getDay();
    const gridStart = new Date(year, monthIndex, 1 - startOffset);
    const todayIso = this.toIso(new Date());
    const summary = this.monthSummary();

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const iso = this.toIso(date);
      const daySummary = summary[iso];
      return {
        date,
        iso,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === monthIndex,
        isToday: iso === todayIso,
        bookingCount: daySummary?.count ?? 0,
        hasEmergency: daySummary?.hasEmergency ?? false,
      };
    });
  });

  readonly selectedDateLabel = computed(() => {
    const [y, m, d] = this.selectedDate().split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  });

  constructor() {
    effect(() => {
      void this.loadMonthSummary(this.calendarMonth());
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.drawerOpen()) this.closeDrawer();
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      void this.applyQueryParams(params);
    });
  }

  detailQueryParams(bookingId: string): Record<string, string> {
    return {
      from: 'calendar',
      date: this.selectedDate(),
      booking: bookingId,
    };
  }

  selectDate(iso: string): void {
    this.selectedDate.set(iso);
    this.drawerOpen.set(true);
    void this.loadDayBookings(iso);
    this.syncUrl();
  }

  selectBooking(b: Booking): void {
    this.selectedBooking.set(b);
    this.syncUrl();
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.syncUrl();
  }

  prevMonth(): void {
    const current = this.calendarMonth();
    this.calendarMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const current = this.calendarMonth();
    this.calendarMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  dotArray(count: number): number[] {
    return Array.from({ length: Math.min(count, 3) }, (_, i) => i);
  }

  formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  }

  private async loadMonthSummary(month: Date): Promise<void> {
    try {
      const key = this.monthKey(month);
      const res = await firstValueFrom(this.bookingApi.getCalendarMonth(key));
      const map: Record<string, { count: number; hasEmergency: boolean }> = {};
      for (const day of res.days) {
        map[day.date] = { count: day.count, hasEmergency: day.hasEmergency };
      }
      this.monthSummary.set(map);
    } catch {
      this.monthSummary.set({});
    }
  }

  private async loadDayBookings(iso: string, preferredBookingId?: string | null): Promise<void> {
    this.dayLoading.set(true);
    try {
      const bookings = sortBookingsByPriority(
        await firstValueFrom(this.bookingApi.list({ scheduledDate: iso, limit: 100 })),
      );
      this.dayBookings.set(bookings);

      if (preferredBookingId) {
        const match = bookings.find((b) => b.id === preferredBookingId);
        if (match) {
          this.selectedBooking.set(match);
          return;
        }
        try {
          this.selectedBooking.set(await firstValueFrom(this.bookingApi.getById(preferredBookingId)));
          return;
        } catch {
          /* fall through */
        }
      }
      this.selectedBooking.set(bookings[0] ?? null);
    } catch {
      this.dayBookings.set([]);
      this.selectedBooking.set(null);
    } finally {
      this.dayLoading.set(false);
    }
  }

  private async applyQueryParams(params: { get: (key: string) => string | null }): Promise<void> {
    const date = params.get('date');
    const bookingId = params.get('booking');

    if (date) {
      this.selectedDate.set(date);
      const [y, m] = date.split('-').map(Number);
      this.calendarMonth.set(new Date(y, m - 1, 1));
      this.drawerOpen.set(true);
      await this.loadDayBookings(date, bookingId);
      return;
    }

    this.drawerOpen.set(false);
    this.selectedBooking.set(null);
    this.dayBookings.set([]);
  }

  private syncUrl(): void {
    const date = this.drawerOpen() ? this.selectedDate() : null;
    const booking = this.drawerOpen() ? (this.selectedBooking()?.id ?? null) : null;
    const current = this.route.snapshot.queryParamMap;
    if (current.get('date') === date && current.get('booking') === booking) return;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date, booking },
      replaceUrl: true,
    });
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private monthKey(month: Date): string {
    const y = month.getFullYear();
    const m = (month.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  }

  private toIso(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
