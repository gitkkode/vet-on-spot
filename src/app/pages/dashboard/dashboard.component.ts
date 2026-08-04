import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BOOKINGS,
  Booking,
  Doctor,
  DOCTORS,
  VEHICLES,
  assignBookingToDoctor,
  formatDoctorVisitLabel,
  formatSubmittedLabel,
  getDoctorStatusLabel,
  getStatusLabel,
  getFuelLevelClass,
  sortAppointmentsForAssign,
  sortBookingsByPriority,
} from '../../data/mock-data';
import { AppointmentService } from '../../services/appointment.service';
import { IconComponent } from '../../components/icon/icon.component';

export type DashboardPeriod = 'today' | 'yesterday' | 'weekly' | 'monthly' | 'quarterly';

interface PeriodMeta {
  label: string;
  bookingsLabel: string;
  comparison: string;
  changePercent: number;
  demoTotal: number;
  demoHomePercent: number;
}

interface ChartBucket {
  label: string;
  total: number;
  home: number;
  online: number;
  clinic: number;
}

interface ChartSeriesPoint {
  x: number;
  y: number;
  value: number;
}

interface ChartSeriesView {
  id: 'total' | 'home' | 'online' | 'clinic';
  label: string;
  color: string;
  path: string;
  areaPath: string;
  points: ChartSeriesPoint[];
}

interface ChartSplineView {
  labels: string[];
  yTicks: number[];
  yMax: number;
  series: ChartSeriesView[];
  width: number;
  height: number;
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
}

type ChartLineFilter = 'all' | 'home' | 'online' | 'clinic';

const LINE_CHART_WIDTH = 720;
const LINE_CHART_HEIGHT = 240;
const LINE_CHART_PADDING = { top: 24, right: 20, bottom: 36, left: 44 };

const CHART_LINE_SERIES = [
  { id: 'total' as const, label: 'Total bookings', color: '#2563EB' },
  { id: 'home' as const, label: 'Home visits', color: '#22C55E' },
  { id: 'online' as const, label: 'Online', color: '#38BDF8' },
  { id: 'clinic' as const, label: 'Clinic', color: '#15803D' },
];

interface DonutStats {
  home: number;
  online: number;
  homePercent: number;
}

const PERIOD_META: Record<DashboardPeriod, PeriodMeta> = {
  today: {
    label: 'Today',
    bookingsLabel: 'Bookings Today',
    comparison: 'vs yesterday',
    changePercent: 12,
    demoTotal: 126,
    demoHomePercent: 62,
  },
  yesterday: {
    label: 'Yesterday',
    bookingsLabel: 'Bookings Yesterday',
    comparison: 'vs prior day',
    changePercent: 5,
    demoTotal: 98,
    demoHomePercent: 58,
  },
  weekly: {
    label: 'Weekly',
    bookingsLabel: 'Bookings This Week',
    comparison: 'vs last week',
    changePercent: 8,
    demoTotal: 842,
    demoHomePercent: 58,
  },
  monthly: {
    label: 'Monthly',
    bookingsLabel: 'Bookings This Month',
    comparison: 'vs last month',
    changePercent: 15,
    demoTotal: 3240,
    demoHomePercent: 60,
  },
  quarterly: {
    label: 'Quarterly',
    bookingsLabel: 'Bookings This Quarter',
    comparison: 'vs last quarter',
    changePercent: 22,
    demoTotal: 9650,
    demoHomePercent: 55,
  },
};

const BUSINESS_START_HOUR = 8;
const TODAY_TABLE_MAX_ROWS = 7;
const ASSIGN_TABLE_MAX_ROWS = 7;

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, IconComponent],
  template: `
    <div class="dashboard-page">
      <div class="page-header dashboard-page__header">
        <div>
          <h1>Dashboard (Overview)</h1>
          <p>Real-time overview of bookings, doctors, and transport</p>
        </div>
        <div class="dashboard-page__header-right">
          <div class="dashboard-period">
          @for (p of periods; track p.key) {
            <button
              type="button"
              class="dashboard-period__btn"
              [class.dashboard-period__btn--active]="selectedPeriod() === p.key"
              (click)="selectedPeriod.set(p.key)"
            >
              {{ p.label }}
            </button>
          }
        </div>
        </div>
      </div>

      <div class="dashboard-charts">
        <div class="card dashboard-chart-card dashboard-chart-card--line">
          <div class="card__header dashboard-chart-card__header">
            <div>
              <h3>Bookings Trend — {{ stats().label }}</h3>
              @if (selectedPeriod() === 'today') {
                <span class="dashboard-chart-card__hint">Up to {{ currentTimeLabel() }}</span>
              }
            </div>
          </div>
          <div
            class="dashboard-line-chart"
            (mouseleave)="hoveredLineIndex.set(null)"
          >
            <div class="dashboard-line-chart__canvas">
              <svg
                class="dashboard-line-chart__svg"
                [attr.viewBox]="'0 0 ' + chartSplineView().width + ' ' + chartSplineView().height"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  @for (series of chartSplineView().series; track series.id) {
                    <linearGradient [attr.id]="'area-' + series.id" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" [attr.stop-color]="series.color" stop-opacity="0.22" />
                      <stop offset="100%" [attr.stop-color]="series.color" stop-opacity="0.02" />
                    </linearGradient>
                  }
                </defs>

                @for (tick of chartSplineView().yTicks; track tick) {
                  <g>
                    <line
                      class="dashboard-line-chart__grid"
                      [attr.x1]="chartSplineView().plotLeft"
                      [attr.x2]="chartSplineView().plotRight"
                      [attr.y1]="yToSvg(tick)"
                      [attr.y2]="yToSvg(tick)"
                    />
                    <text
                      class="dashboard-line-chart__y-label"
                      [attr.x]="chartSplineView().plotLeft - 8"
                      [attr.y]="yToSvg(tick) + 4"
                      text-anchor="end"
                    >
                      {{ tick }}
                    </text>
                  </g>
                }

                @for (series of chartSplineView().series; track series.id) {
                  <path
                    class="dashboard-line-chart__area"
                    [attr.d]="series.areaPath"
                    [attr.fill]="'url(#area-' + series.id + ')'"
                  />
                }

                @for (series of chartSplineView().series; track series.id) {
                  <path
                    class="dashboard-line-chart__line"
                    [attr.d]="series.path"
                    [attr.stroke]="series.color"
                  />
                }

                @if (hoveredLineIndex(); as idx) {
                  <rect
                    class="dashboard-line-chart__cursor-band"
                    [attr.x]="chartSplineView().series[0].points[idx].x - 14"
                    [attr.y]="chartSplineView().plotTop"
                    width="28"
                    [attr.height]="chartSplineView().plotBottom - chartSplineView().plotTop"
                  />
                  <line
                    class="dashboard-line-chart__cursor"
                    [attr.x1]="chartSplineView().series[0].points[idx].x"
                    [attr.x2]="chartSplineView().series[0].points[idx].x"
                    [attr.y1]="chartSplineView().plotTop"
                    [attr.y2]="chartSplineView().plotBottom"
                  />
                  @for (series of chartSplineView().series; track series.id) {
                    <circle
                      class="dashboard-line-chart__dot"
                      [attr.cx]="series.points[idx].x"
                      [attr.cy]="series.points[idx].y"
                      [attr.fill]="series.color"
                      r="5"
                    />
                  }
                }

                @for (label of chartSplineView().labels; track label; let i = $index) {
                  <text
                    class="dashboard-line-chart__x-label"
                    [attr.x]="chartSplineView().series[0]?.points[i]?.x ?? 0"
                    [attr.y]="chartSplineView().height - 10"
                    text-anchor="middle"
                  >
                    {{ label }}
                  </text>
                  <rect
                    class="dashboard-line-chart__hit"
                    [attr.x]="(chartSplineView().series[0]?.points[i]?.x ?? 0) - 18"
                    [attr.y]="chartSplineView().plotTop"
                    width="36"
                    [attr.height]="chartSplineView().plotBottom - chartSplineView().plotTop"
                    (mouseenter)="hoveredLineIndex.set(i)"
                  />
                }
              </svg>

              @if (hoveredLineIndex(); as idx) {
                <div class="dashboard-line-chart__tooltips">
                  @for (series of chartSplineView().series; track series.id) {
                    <span
                      class="dashboard-line-chart__pill"
                      [style.left.%]="pillLeftPercent(idx)"
                      [style.top.px]="series.points[idx].y - 14 - ($index * 26)"
                      [style.borderColor]="series.color"
                      [style.color]="series.color"
                    >
                      {{ series.points[idx].value }}
                    </span>
                  }
                </div>
              }
            </div>

            <aside class="dashboard-line-chart__legend">
              @for (series of chartSplineView().series; track series.id) {
                <div class="dashboard-line-chart__legend-item">
                  <span class="dashboard-line-chart__legend-dot" [style.background]="series.color"></span>
                  {{ series.label }}
                </div>
              }
            </aside>

            <div class="dashboard-line-chart__filters">
              @for (f of lineFilters; track f.key) {
                <button
                  type="button"
                  class="dashboard-line-chart__filter"
                  [class.dashboard-line-chart__filter--active]="chartLineFilter() === f.key"
                  (click)="chartLineFilter.set(f.key)"
                >
                  {{ f.label }}
                </button>
              }
            </div>
          </div>
        </div>

        <div class="card dashboard-chart-card dashboard-chart-card--donut">
          <div class="card__header">
            <h3>Home vs Online</h3>
          </div>
          <div class="dashboard-donut-wrap">
            <div
              class="donut-interactive"
              (mousemove)="onDonutMouseMove($event)"
              (mouseleave)="donutHover.set(null); donutTooltipPos.set(null)"
            >
              <div class="donut-chart donut-chart--lg" [style.background]="donutGradient()"></div>
              @if (donutHover(); as segment) {
                @if (donutTooltipPos(); as pos) {
                  <div
                    class="chart-tooltip chart-tooltip--donut"
                    [style.left.px]="pos.x"
                    [style.top.px]="pos.y"
                  >
                    @if (segment === 'home') {
                      {{ donutStats().home }} home · {{ donutStats().homePercent }}%
                    } @else {
                      {{ donutStats().online }} online · {{ 100 - donutStats().homePercent }}%
                    }
                  </div>
                }
              }
            </div>
            <div class="donut-legend donut-legend--stacked">
              <span
                class="home"
                (mouseenter)="donutHover.set('home')"
                (mouseleave)="donutHover.set(null)"
              >
                Home visits — {{ donutStats().home }} ({{ donutStats().homePercent }}%)
              </span>
              <span
                class="online"
                (mouseenter)="donutHover.set('online')"
                (mouseleave)="donutHover.set(null)"
              >
                Online consults — {{ donutStats().online }} ({{ 100 - donutStats().homePercent }}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      <section class="dashboard-snapshot-row">
        <div class="card dashboard-today-appointments">
          <div class="card__header">
            <h3>Today's Appointments</h3>
            <div class="dashboard-today-appointments__head-actions">
              <a routerLink="/bookings" class="btn-outline">View all</a>
            </div>
          </div>
          <div class="dashboard-assign-table-wrap">
            <table class="data-table dashboard-assign-table dashboard-today-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Doctor</th>
                </tr>
              </thead>
              <tbody>
                @for (b of todayAppointments(); track b.id) {
                  <tr
                    class="dashboard-assign-table__row"
                    [class.dashboard-assign-table__row--emergency]="b.isEmergency"
                  >
                    <td>{{ b.id }}</td>
                    <td>
                      <strong class="dashboard-assign-table__name">{{ b.petName }} — {{ b.customerName }}</strong>
                      @if (b.isEmergency) {
                        <span class="emergency-badge emergency-badge--inline">
                          <app-icon name="alert" size="sm" /> Emergency
                        </span>
                      }
                    </td>
                    <td>
                      <span class="dashboard-assign-table__visit">{{ formatDoctorVisitLabel(b) }}</span>
                    </td>
                    <td>
                      <span class="status-pill status-pill--{{ b.status }}">
                        {{ statusLabel(b.status) }}
                      </span>
                    </td>
                    <td>
                      @if (b.assignedDoctor) {
                        <span class="dashboard-assign-table__doctor">{{ b.assignedDoctor }}</span>
                      } @else {
                        —
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="dashboard-assign-table__empty">No appointments scheduled for today</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <aside class="dashboard-doctors-panel">
          <div class="dashboard-doctors-panel__block">
            <h3>Active Doctors</h3>
            @for (d of activeDoctors; track d.id) {
              <div class="dashboard-doctor-item dashboard-doctor-item--active">
                <span class="avatar">{{ d.initials }}</span>
                <div class="dashboard-doctor-item__info">
                  <strong>{{ d.name }}</strong>
                  <span>{{ d.specialty }} · {{ doctorStatus(d.status) }}</span>
                </div>
              </div>
            } @empty {
              <p class="dashboard-doctors-panel__empty">No active doctors</p>
            }
          </div>
          <div class="dashboard-doctors-panel__block">
            <h3>Inactive Doctors</h3>
            @for (d of inactiveDoctors; track d.id) {
              <div class="dashboard-doctor-item dashboard-doctor-item--inactive">
                <span class="avatar">{{ d.initials }}</span>
                <div class="dashboard-doctor-item__info">
                  <strong>{{ d.name }}</strong>
                  <span>{{ d.specialty }} · Offline</span>
                </div>
              </div>
            } @empty {
              <p class="dashboard-doctors-panel__empty">No inactive doctors</p>
            }
          </div>
        </aside>

        <div class="card dashboard-transport-card">
          <div class="card__header"><h3>Transport Snapshot</h3></div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Rides</th>
                <th>Km</th>
                <th>Fuel</th>
              </tr>
            </thead>
            <tbody>
              @for (v of vehicles.slice(0, 4); track v.id) {
                <tr>
                  <td>{{ v.id }}</td>
                  <td>{{ ridesForPeriod(v.ridesToday) }}</td>
                  <td>{{ kmForPeriod(v.kmToday) }} km</td>
                  <td>
                    <div class="fuel-bar">
                      <div
                        class="fuel-bar__fill fuel-bar__fill--{{ fuelClass(v.fuelPercent) }}"
                        [style.width.%]="v.fuelPercent"
                      ></div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <div class="dashboard-transport-chart">
            <div class="dashboard-transport-chart__head">
              <span>Rides vs Km</span>
              <span class="dashboard-transport-chart__legend">
                <i class="dashboard-transport-chart__dot dashboard-transport-chart__dot--rides"></i> Rides
                <i class="dashboard-transport-chart__dot dashboard-transport-chart__dot--km"></i> Km
              </span>
            </div>
            <div class="dashboard-transport-chart__bars">
              @for (bar of transportChartBars(); track bar.id) {
                <div
                  class="dashboard-transport-chart__col"
                  (mouseenter)="transportHoverId.set(bar.id)"
                  (mouseleave)="transportHoverId.set(null)"
                >
                  <div class="dashboard-transport-chart__pair">
                    <div
                      class="dashboard-transport-chart__bar dashboard-transport-chart__bar--rides"
                      [style.height.%]="bar.ridesPct"
                    ></div>
                    <div
                      class="dashboard-transport-chart__bar dashboard-transport-chart__bar--km"
                      [style.height.%]="bar.kmPct"
                    ></div>
                    @if (transportHoverId() === bar.id) {
                      <div
                        class="dashboard-transport-chart__tooltip"
                        [style.bottom.%]="bar.ridesPct >= bar.kmPct ? bar.ridesPct : bar.kmPct"
                      >
                        <strong>{{ bar.id }}</strong>
                        <span>Rides: {{ bar.rides }}</span>
                        <span>Km: {{ bar.km }}</span>
                      </div>
                    }
                  </div>
                  <span class="dashboard-transport-chart__label">{{ bar.id }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <section class="dashboard-assign-row">
        <div class="card dashboard-new-appointments">
          <div class="card__header">
            <h3>New Appointments — Assign Doctor</h3>
            <div class="dashboard-new-appointments__head-actions">
              <span class="status-pill status-pill--pending">{{ awaitingAssignmentCount() }} awaiting assignment</span>
              <a routerLink="/bookings" class="btn-outline">View all</a>
            </div>
          </div>
          <div class="dashboard-assign-table-wrap">
            <table class="data-table dashboard-assign-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Submitted</th>
                  <th>Doctor Visit</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Doctor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (b of assignTableRows(); track b.id) {
                  <tr
                    class="dashboard-assign-table__row"
                    [class.dashboard-assign-table__row--emergency]="b.isEmergency"
                  >
                    <td>{{ b.id }}</td>
                    <td>
                      <strong class="dashboard-assign-table__name">{{ b.petName }} — {{ b.customerName }}</strong>
                      @if (b.isEmergency) {
                        <span class="emergency-badge emergency-badge--inline">
                          <app-icon name="alert" size="sm" /> Emergency
                        </span>
                      }
                    </td>
                    <td>
                      <span class="dashboard-assign-table__submitted">{{ formatSubmittedLabel(b) }}</span>
                    </td>
                    <td>
                      <span class="dashboard-assign-table__visit">{{ formatDoctorVisitLabel(b) }}</span>
                    </td>
                    <td>
                      <span
                        class="status-pill"
                        [class.status-pill--online]="b.type === 'online'"
                        [class.status-pill--home]="b.type === 'home'"
                        [class.status-pill--accepted]="b.type === 'clinic'"
                      >
                        {{ bookingTypeLabel(b.type) }}
                      </span>
                    </td>
                    <td>
                      <span class="status-pill status-pill--{{ b.status }}">
                        {{ statusLabel(b.status) }}
                      </span>
                    </td>
                    <td>
                      @if (b.assignedDoctor) {
                        <span class="dashboard-assign-table__doctor">{{ b.assignedDoctor }}</span>
                      } @else {
                        —
                      }
                    </td>
                    <td class="dashboard-assign-table__actions-cell">
                      <div class="dashboard-row-menu">
                        <button
                          type="button"
                          class="dashboard-row-menu__trigger"
                          aria-label="Actions"
                          (click)="toggleActionMenu(b.id, $event)"
                        >
                          <app-icon name="more-vertical" size="sm" />
                        </button>
                        @if (openActionMenuId() === b.id) {
                          <div class="dashboard-row-menu__dropdown" (click)="$event.stopPropagation()">
                            <button type="button" (click)="openAssignPopup(b)">
                              {{ b.assignedDoctor ? 'Reassign' : 'Assign' }}
                            </button>
                            <button type="button" (click)="editBooking(b)">Edit</button>
                          </div>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="dashboard-assign-table__empty">No appointments in the queue</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>

      @if (assignPopupBooking(); as booking) {
        <div class="modal-backdrop" (click)="closeAssignPopup()"></div>
        <div class="dashboard-assign-popup" role="dialog" aria-labelledby="assign-popup-title">
          <header class="dashboard-assign-popup__header">
            <div>
              <h3 id="assign-popup-title">Assign Doctor</h3>
              <p>{{ booking.petName }} — {{ booking.customerName }} · {{ booking.id }}</p>
            </div>
            <button type="button" class="dashboard-assign-popup__close" (click)="closeAssignPopup()" aria-label="Close">
              <app-icon name="close" size="md" />
            </button>
          </header>
          <div class="dashboard-assign-popup__body">
            <p class="dashboard-assign-popup__hint">Select an available doctor to assign this appointment</p>
            @if (availableDoctors.length > 0) {
              <div class="dashboard-assign-popup__list">
                @for (d of availableDoctors; track d.id) {
                  <button
                    type="button"
                    class="dashboard-assign-popup__doctor"
                    [class.dashboard-assign-popup__doctor--selected]="selectedAssignDoctorId() === d.id"
                    (click)="selectAssignDoctor(d.id)"
                  >
                    <span class="avatar">{{ d.initials }}</span>
                    <div class="dashboard-assign-popup__doctor-info">
                      <strong>{{ d.name }}</strong>
                      <span>{{ d.specialty }} · {{ doctorStatus(d.status) }}</span>
                      <span class="dashboard-assign-popup__location icon-inline">
                        <app-icon name="map-pin" size="sm" /> {{ d.location }}
                      </span>
                    </div>
                  </button>
                }
              </div>
            } @else {
              <p class="dashboard-assign-popup__empty">No doctors are available right now. Try again later.</p>
            }
          </div>
          @if (availableDoctors.length > 0) {
            <footer class="dashboard-assign-popup__footer">
              <button type="button" class="btn-outline" (click)="closeAssignPopup()">Cancel</button>
              <button
                type="button"
                class="btn-primary"
                [disabled]="!selectedAssignDoctorId()"
                (click)="confirmAssign(booking)"
              >
                Assign
              </button>
            </footer>
          }
        </div>
      }
    </div>
  `,
})
export class DashboardComponent {
  private readonly appointmentService = inject(AppointmentService);

  readonly periods: { key: DashboardPeriod; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'quarterly', label: 'Quarterly' },
  ];

  readonly selectedPeriod = signal<DashboardPeriod>('today');
  readonly hoveredLineIndex = signal<number | null>(null);
  readonly chartLineFilter = signal<ChartLineFilter>('all');
  readonly donutHover = signal<'home' | 'online' | null>(null);
  readonly donutTooltipPos = signal<{ x: number; y: number } | null>(null);
  readonly assignPopupBooking = signal<Booking | null>(null);
  readonly selectedAssignDoctorId = signal<string | null>(null);
  readonly openActionMenuId = signal<string | null>(null);
  readonly transportHoverId = signal<string | null>(null);

  readonly lineFilters: { key: ChartLineFilter; label: string }[] = [
    { key: 'all', label: 'Overview' },
    { key: 'home', label: 'Home' },
    { key: 'online', label: 'Online' },
    { key: 'clinic', label: 'Clinic' },
  ];

  readonly bookings = BOOKINGS;
  readonly doctors = DOCTORS;
  readonly vehicles = VEHICLES;

  readonly stats = computed(() => PERIOD_META[this.selectedPeriod()]);

  readonly assignTableRows = computed((): Booking[] => {
    this.appointmentService.bookingsVersion();
    const today = new Date().toISOString().slice(0, 10);
    return sortAppointmentsForAssign(
      BOOKINGS.filter(
        (b) =>
          b.status === 'pending' ||
          b.status === 'sent' ||
          (b.status === 'accepted' && !!b.assignedDoctor),
      ),
      today,
    ).slice(0, ASSIGN_TABLE_MAX_ROWS);
  });

  readonly todayAppointments = computed((): Booking[] => {
    this.appointmentService.bookingsVersion();
    const today = this.getTodayIso();
    return sortBookingsByPriority(
      BOOKINGS.filter((b) => b.scheduledDate === today && b.status !== 'cancelled'),
    ).slice(0, TODAY_TABLE_MAX_ROWS);
  });

  readonly awaitingAssignmentCount = computed(() => {
    this.appointmentService.bookingsVersion();
    return BOOKINGS.filter((b) => !b.assignedDoctor && (b.status === 'pending' || b.status === 'sent')).length;
  });

  readonly availableDoctors = DOCTORS.filter((d) => d.status === 'available');

  readonly activeDoctors = DOCTORS.filter((d) => d.status !== 'offline');

  readonly inactiveDoctors = DOCTORS.filter((d) => d.status === 'offline');

  readonly transportChartBars = computed(() => {
    const list = this.vehicles.slice(0, 4).map((v) => ({
      id: v.id,
      rides: this.ridesForPeriod(v.ridesToday),
      km: this.kmForPeriod(v.kmToday),
    }));
    const maxRides = Math.max(...list.map((v) => v.rides), 1);
    const maxKm = Math.max(...list.map((v) => v.km), 1);
    return list.map((v) => ({
      ...v,
      ridesPct: Math.max(12, Math.round((v.rides / maxRides) * 100)),
      kmPct: Math.max(12, Math.round((v.km / maxKm) * 100)),
    }));
  });

  readonly periodBookings = computed(() => {
    this.appointmentService.bookingsVersion();
    return this.bookings.filter((b) => this.isInPeriod(b, this.selectedPeriod()));
  });

  readonly chartSplineView = computed((): ChartSplineView => {
    const buckets = this.buildChartBuckets(this.selectedPeriod(), this.periodBookings());
    const filter = this.chartLineFilter();
    const visibleIds: ChartSeriesView['id'][] =
      filter === 'all' ? ['total', 'home', 'online', 'clinic'] : [filter];

    const rawMax = Math.max(
      ...buckets.flatMap((b) => [b.total, b.home, b.online, b.clinic]),
      4,
    );
    const yMax = Math.ceil(rawMax / 4) * 4;

    const plotLeft = LINE_CHART_PADDING.left;
    const plotRight = LINE_CHART_WIDTH - LINE_CHART_PADDING.right;
    const plotTop = LINE_CHART_PADDING.top;
    const plotBottom = LINE_CHART_HEIGHT - LINE_CHART_PADDING.bottom;
    const plotW = plotRight - plotLeft;
    const plotH = plotBottom - plotTop;
    const step = buckets.length > 1 ? plotW / (buckets.length - 1) : 0;

    const series = CHART_LINE_SERIES.filter((meta) => visibleIds.includes(meta.id)).map((meta) => {
      const values = buckets.map((b) => b[meta.id]);
      const points = values.map((value, i) => ({
        x: plotLeft + i * step,
        y: plotTop + plotH - (value / yMax) * plotH,
        value,
      }));
      return {
        ...meta,
        path: this.buildSplinePath(points),
        areaPath: this.buildAreaPath(points, plotBottom),
        points,
      };
    });

    const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax].map((v) => Math.round(v));

    return {
      labels: buckets.map((b) => b.label),
      yTicks,
      yMax,
      series,
      width: LINE_CHART_WIDTH,
      height: LINE_CHART_HEIGHT,
      plotLeft,
      plotRight,
      plotTop,
      plotBottom,
    };
  });

  readonly donutStats = computed((): DonutStats => {
    const bookings = this.periodBookings();
    const home = bookings.filter((b) => b.type === 'home').length;
    const online = bookings.filter((b) => b.type === 'online').length;
    const total = home + online;

    if (total > 0) {
      return {
        home,
        online,
        homePercent: Math.round((home / total) * 100),
      };
    }

    const meta = this.stats();
    const demoTotal = meta.demoTotal;
    const homePercent = meta.demoHomePercent;
    const demoHome = Math.round((demoTotal * homePercent) / 100);
    return {
      home: demoHome,
      online: demoTotal - demoHome,
      homePercent,
    };
  });

  statusLabel = getStatusLabel;
  doctorStatus = getDoctorStatusLabel;
  fuelClass = getFuelLevelClass;

  readonly formatSubmittedLabel = formatSubmittedLabel;
  readonly formatDoctorVisitLabel = formatDoctorVisitLabel;

  @HostListener('document:click')
  closeActionMenu(): void {
    this.openActionMenuId.set(null);
  }

  toggleActionMenu(bookingId: string, event: Event): void {
    event.stopPropagation();
    this.openActionMenuId.update((current) => (current === bookingId ? null : bookingId));
  }

  bookingTypeLabel(type: Booking['type']): string {
    if (type === 'online') return 'Online';
    if (type === 'clinic') return 'Clinic';
    return 'Home';
  }

  formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  }

  openAssignPopup(booking: Booking): void {
    this.openActionMenuId.set(null);
    this.selectedAssignDoctorId.set(null);
    this.assignPopupBooking.set(booking);
  }

  closeAssignPopup(): void {
    this.assignPopupBooking.set(null);
    this.selectedAssignDoctorId.set(null);
  }

  selectAssignDoctor(doctorId: string): void {
    this.selectedAssignDoctorId.set(doctorId);
  }

  confirmAssign(booking: Booking): void {
    const doctorId = this.selectedAssignDoctorId();
    if (!doctorId) return;
    const doctor = DOCTORS.find((d) => d.id === doctorId);
    if (!doctor) return;
    this.assignToDoctor(booking, doctor);
  }

  assignToDoctor(booking: Booking, doctor: Doctor): void {
    assignBookingToDoctor(booking, doctor);
    this.appointmentService.bookingsVersion.update((v) => v + 1);
    this.closeAssignPopup();
  }

  editBooking(booking: Booking): void {
    this.openActionMenuId.set(null);
    this.appointmentService.openEditModal(booking);
  }

  currentTimeLabel(): string {
    return this.formatHourLabel(new Date().getHours());
  }

  yToSvg(value: number): number {
    const view = this.chartSplineView();
    const plotH = view.plotBottom - view.plotTop;
    return view.plotTop + plotH - (value / view.yMax) * plotH;
  }

  pillLeftPercent(index: number): number {
    const view = this.chartSplineView();
    if (!view.series[0]?.points[index]) return 0;
    return (view.series[0].points[index].x / view.width) * 100;
  }

  donutGradient(): string {
    const home = this.donutStats().homePercent;
    return `conic-gradient(#2563eb 0% ${home}%, #22c55e ${home}% 100%)`;
  }

  onDonutMouseMove(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = event.clientX - rect.left - cx;
    const dy = event.clientY - rect.top - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const outer = rect.width / 2;
    const inner = outer * 0.46;

    if (dist < inner || dist > outer) {
      this.donutHover.set(null);
      this.donutTooltipPos.set(null);
      return;
    }

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    angle = (angle + 90 + 360) % 360;
    const homeAngle = (this.donutStats().homePercent / 100) * 360;
    this.donutHover.set(angle <= homeAngle ? 'home' : 'online');

    const angleRad = ((angle - 90) * Math.PI) / 180;
    const tipRadius = outer + 14;
    this.donutTooltipPos.set({
      x: cx + Math.cos(angleRad) * tipRadius,
      y: cy + Math.sin(angleRad) * tipRadius,
    });
  }

  ridesForPeriod(todayRides: number): number {
    const multipliers: Record<DashboardPeriod, number> = {
      today: 1,
      yesterday: 1,
      weekly: 5,
      monthly: 22,
      quarterly: 68,
    };
    return todayRides * multipliers[this.selectedPeriod()];
  }

  kmForPeriod(todayKm: number): number {
    const multipliers: Record<DashboardPeriod, number> = {
      today: 1,
      yesterday: 1,
      weekly: 6,
      monthly: 24,
      quarterly: 72,
    };
    return todayKm * multipliers[this.selectedPeriod()];
  }

  private buildChartBuckets(period: DashboardPeriod, bookings: Booking[]): ChartBucket[] {
    if (period === 'today') {
      return this.buildHourlyBuckets(bookings, this.getTodayIso(), this.getCurrentHour(), 'today');
    }
    if (period === 'yesterday') {
      return this.buildHourlyBuckets(bookings, this.getYesterdayIso(), 23, 'yesterday');
    }
    if (period === 'weekly') {
      return this.buildWeeklyBuckets(bookings);
    }
    if (period === 'monthly') {
      return this.buildMonthlyBuckets(bookings);
    }
    return this.buildQuarterlyBuckets(bookings);
  }

  private buildSplinePath(points: ChartSeriesPoint[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  }

  private buildAreaPath(points: ChartSeriesPoint[], baseline: number): string {
    if (points.length === 0) return '';
    const line = this.buildSplinePath(points);
    const last = points[points.length - 1];
    const first = points[0];
    return `${line} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
  }

  private bucketFromBookings(bookings: Booking[]): Omit<ChartBucket, 'label'> {
    return {
      total: bookings.length,
      home: bookings.filter((b) => b.type === 'home').length,
      online: bookings.filter((b) => b.type === 'online').length,
      clinic: bookings.filter((b) => b.type === 'clinic').length,
    };
  }

  private demoBucket(period: DashboardPeriod, index: number): Omit<ChartBucket, 'label'> {
    const total = this.demoBucketCount(period, index);
    const home = Math.round(total * 0.55);
    const online = Math.round(total * 0.28);
    const clinic = Math.max(0, total - home - online);
    return { total, home, online, clinic };
  }

  private buildHourlyBuckets(
    bookings: Booking[],
    dateIso: string,
    maxHour: number,
    period: 'today' | 'yesterday',
  ): ChartBucket[] {
    const start = BUSINESS_START_HOUR;
    const end = Math.max(start, maxHour);
    const buckets: ChartBucket[] = [];

    for (let hour = start; hour <= end; hour++) {
      const hourBookings = bookings.filter((b) => {
        if (b.scheduledDate !== dateIso) return false;
        return this.getBookingHour(b) === hour;
      });
      const counts = this.bucketFromBookings(hourBookings);
      const useDemo = counts.total === 0;
      const demo = this.demoBucket(period, buckets.length);

      buckets.push({
        label: this.formatHourLabel(hour),
        total: useDemo ? demo.total : counts.total,
        home: useDemo ? demo.home : counts.home,
        online: useDemo ? demo.online : counts.online,
        clinic: useDemo ? demo.clinic : counts.clinic,
      });
    }

    return buckets;
  }

  private buildWeeklyBuckets(bookings: Booking[]): ChartBucket[] {
    const days: { iso: string; label: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        iso: this.toIso(d),
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }

    return days.map((day, i) => {
      const dayBookings = bookings.filter((b) => b.scheduledDate === day.iso);
      const counts = this.bucketFromBookings(dayBookings);
      const useDemo = counts.total === 0;
      const demo = this.demoBucket('weekly', i);

      return {
        label: day.label,
        total: useDemo ? demo.total : counts.total,
        home: useDemo ? demo.home : counts.home,
        online: useDemo ? demo.online : counts.online,
        clinic: useDemo ? demo.clinic : counts.clinic,
      };
    });
  }

  private buildMonthlyBuckets(bookings: Booking[]): ChartBucket[] {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthShort = now.toLocaleDateString('en-US', { month: 'short' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const step = 5;
    const buckets: ChartBucket[] = [];

    for (let start = 1; start <= daysInMonth; start += step) {
      const end = Math.min(start + step - 1, daysInMonth);
      const rangeBookings = bookings.filter((b) => {
        const [y, m, d] = b.scheduledDate.split('-').map(Number);
        return y === year && m === month + 1 && d >= start && d <= end;
      });

      const counts = this.bucketFromBookings(rangeBookings);
      const useDemo = counts.total === 0;
      const demo = this.demoBucket('monthly', buckets.length);

      buckets.push({
        label: start === end ? `${monthShort} ${start}` : `${monthShort} ${start}–${end}`,
        total: useDemo ? demo.total : counts.total,
        home: useDemo ? demo.home : counts.home,
        online: useDemo ? demo.online : counts.online,
        clinic: useDemo ? demo.clinic : counts.clinic,
      });
    }

    return buckets;
  }

  private buildQuarterlyBuckets(bookings: Booking[]): ChartBucket[] {
    const now = new Date();
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const months = [0, 1, 2].map((offset) => {
      const d = new Date(now.getFullYear(), quarterStartMonth + offset, 1);
      return {
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: d.toLocaleDateString('en-US', { month: 'short' }),
      };
    });

    return months.map((m, i) => {
      const monthBookings = bookings.filter((b) => {
        const [y, mo] = b.scheduledDate.split('-').map(Number);
        return y === m.year && mo === m.month;
      });
      const counts = this.bucketFromBookings(monthBookings);
      const useDemo = counts.total === 0;
      const demo = this.demoBucket('quarterly', i);
      return {
        label: m.label,
        total: useDemo ? demo.total : counts.total,
        home: useDemo ? demo.home : counts.home,
        online: useDemo ? demo.online : counts.online,
        clinic: useDemo ? demo.clinic : counts.clinic,
      };
    });
  }

  private demoBucketCount(period: DashboardPeriod, index: number): number {
    const hourlyWeights = [6, 9, 12, 14, 16, 18, 15, 13, 11, 10, 8, 7, 9, 12, 14, 11];
    const dailyWeights = [22, 28, 35, 31, 38, 44, 40];
    const rangeWeights = [18, 24, 31, 28, 35, 42, 38];

    if (period === 'today' || period === 'yesterday') {
      const scale = PERIOD_META[period].demoTotal / 140;
      return Math.max(2, Math.round(hourlyWeights[index % hourlyWeights.length] * scale));
    }

    if (period === 'weekly') {
      const scale = PERIOD_META.weekly.demoTotal / 240;
      return Math.max(4, Math.round(dailyWeights[index % dailyWeights.length] * scale));
    }

    const scale = PERIOD_META[period].demoTotal / 1200;
    return Math.max(0, Math.round(rangeWeights[index % rangeWeights.length] * scale));
  }

  private formatHourLabel(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const display = hour % 12 || 12;
    return `${display} ${period}`;
  }

  private getBookingHour(booking: Booking): number {
    return Number(booking.scheduledTime.split(':')[0]);
  }

  private bookingMinutes(booking: Booking): number {
    const [h, m] = booking.scheduledTime.split(':').map(Number);
    return h * 60 + m;
  }

  private nowMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  private isUpToNow(booking: Booking): boolean {
    if (booking.scheduledDate !== this.getTodayIso()) return true;
    return this.bookingMinutes(booking) <= this.nowMinutes();
  }

  private getCurrentHour(): number {
    return new Date().getHours();
  }

  private getTodayIso(): string {
    return this.toIso(new Date());
  }

  private getYesterdayIso(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return this.toIso(d);
  }

  private toIso(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private isInPeriod(booking: Booking, period: DashboardPeriod): boolean {
    const date = booking.scheduledDate;

    if (period === 'today') {
      return date === this.getTodayIso() && this.isUpToNow(booking);
    }
    if (period === 'yesterday') {
      return date === this.getYesterdayIso();
    }
    if (period === 'weekly') {
      const d = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d >= start && d <= today;
    }
    if (period === 'monthly') {
      const now = new Date();
      const [y, m] = date.split('-').map(Number);
      return y === now.getFullYear() && m === now.getMonth() + 1;
    }
    if (period === 'quarterly') {
      const now = new Date();
      const [y, m] = date.split('-').map(Number);
      const qStart = Math.floor(now.getMonth() / 3) * 3 + 1;
      const qEnd = qStart + 2;
      return y === now.getFullYear() && m >= qStart && m <= qEnd;
    }
    return true;
  }
}
