import { Component, computed, signal } from '@angular/core';
import {
  BOOKINGS,
  DOCTORS,
  VEHICLES,
  Booking,
  Doctor,
  acceptBookingForDoctor,
  getEmergencySlaLabel,
  sortBookingsByPriority,
} from '../../data/mock-data';
import {
  BangaloreMapComponent,
  BangaloreMapMarker,
} from '../../components/bangalore-map/bangalore-map.component';
import {
  bookingGeo,
  buildDispatchMapMarkers,
  distanceKm,
  doctorGeo,
  formatDistance,
  estimateEtaMinutes,
  vehicleGeo,
} from '../../data/map-markers';
import { IconComponent } from '../../components/icon/icon.component';

interface DoctorWithDistance extends Doctor {
  computedDistanceKm: number;
  etaMin: number;
}

@Component({
  selector: 'app-dispatch',
  imports: [IconComponent, BangaloreMapComponent],
  template: `
    <div class="dispatch-page">
      <div class="page-header">
        <h1>Dispatch</h1>
        <p>Live Bangalore map — doctors, vehicles & booking locations with distance from client</p>
      </div>

      <div class="dispatch-layout">
        <div class="dispatch-queue">
          <h3 class="card__title">Incoming Queue</h3>
          @for (b of queue(); track b.id) {
            <div
              class="queue-card"
              [class.queue-card--selected]="selected()?.id === b.id"
              [class.queue-card--emergency]="b.isEmergency"
              (click)="selectBooking(b)"
            >
              @if (b.isEmergency) {
                <div class="queue-card__emergency icon-inline">
                  <app-icon name="alert" size="sm" /> Emergency — reach within 60 min
                </div>
              }
              <div class="queue-card__time icon-inline">
                <app-icon name="clock" size="sm" /> {{ b.createdAt }}
              </div>
              <strong>{{ b.customerName }}</strong>
              <div class="queue-card__reason">{{ b.reason }}</div>
              <div class="queue-card__location icon-inline">
                <app-icon name="map-pin" size="sm" />
                <span>{{ b.area ?? b.location }}</span>
              </div>
            </div>
          }
        </div>

        <div class="dispatch-map-wrap">
          <app-bangalore-map
            [markers]="mapMarkers()"
            [selectedId]="selectedMapId()"
            [showRadius]="true"
            [showDistanceLines]="true"
            (markerSelect)="onMapMarkerSelect($event)"
          />
          @if (selected(); as b) {
            <div class="dispatch-map-stats">
              <div class="dispatch-map-stats__item">
                <label>Client area</label>
                <strong>{{ clientArea() }}</strong>
              </div>
              <div class="dispatch-map-stats__item">
                <label>Nearest doctor</label>
                <strong>{{ nearestDoctorLabel() }}</strong>
              </div>
              <div class="dispatch-map-stats__item">
                <label>Nearest vehicle</label>
                <strong>{{ nearestVehicleLabel() }}</strong>
              </div>
            </div>
          }
        </div>

        <div class="card dispatch-panel">
          @if (selected(); as b) {
            <div class="dispatch-banner dispatch-banner--{{ bannerType() }}">
              {{ bannerMessage() }}
            </div>
            <h3 class="card__title">Booking {{ b.id }}</h3>
            <p class="dispatch-panel__customer"><strong>{{ b.customerName }}</strong></p>
            <p class="dispatch-panel__location icon-inline">
              <app-icon name="map-pin" size="sm" />
              {{ b.location }}
            </p>
            <p class="dispatch-panel__area">
              Area: <strong>{{ b.area ?? bookingGeo(b).area }}</strong>
            </p>
            @if (b.isEmergency) {
              <p class="dispatch-emergency-sla">{{ emergencySla(b) }}</p>
            }
            <p class="dispatch-panel__reason">Reason: {{ b.reason }}</p>

            @if (b.status !== 'accepted') {
              <h4 class="dispatch-section-title">Nearby Doctors (from client)</h4>
              @for (d of nearbyDoctors(); track d.id) {
                <label
                  class="doctor-select"
                  [class.doctor-select--busy]="d.status !== 'available'"
                >
                  <input
                    type="checkbox"
                    [disabled]="d.status !== 'available'"
                    [checked]="selectedDoctors().has(d.id)"
                    (change)="toggleDoctor(d.id, d.status)"
                  />
                  <span class="avatar">{{ d.initials }}</span>
                  <div class="doctor-select__info">
                    <strong>{{ d.name }}</strong>
                    <span>{{ d.area }} · {{ formatDistance(d.computedDistanceKm) }} · ~{{ d.etaMin }} min</span>
                    <span class="doctor-select__status">
                      {{ d.status === 'available' ? 'Available' : 'Busy' }}
                    </span>
                  </div>
                </label>
              }

              <h4 class="dispatch-section-title">Fleet Vehicles (from client)</h4>
              @for (v of nearbyVehicles(); track v.id) {
                <div class="dispatch-vehicle-row">
                  <app-icon name="truck" size="sm" />
                  <div>
                    <strong>{{ v.id }}</strong>
                    <span>{{ v.driver ?? 'Unassigned' }} · {{ v.area }}</span>
                  </div>
                  <span class="dispatch-vehicle-row__dist">
                    {{ formatDistance(v.distanceKm) }} · ~{{ v.etaMin }} min
                  </span>
                </div>
              }

              @if (b.status === 'pending' || b.status === 'sent') {
                <button
                  type="button"
                  class="btn-primary dispatch-action-btn"
                  [disabled]="selectedDoctors().size === 0 || b.status === 'sent'"
                  (click)="sendRequest()"
                >
                  {{ b.status === 'sent' ? 'Request Sent' : 'Send Request to Selected Doctors' }}
                </button>
              }

              @if (b.status === 'sent') {
                <div class="dispatch-accept-panel">
                  <h4 class="dispatch-section-title">Accept on Behalf of Doctor</h4>
                  <p class="dispatch-accept-panel__hint">
                    Admin can accept for the doctor who will take this booking
                  </p>
                  @for (id of sentDoctorIds(); track id) {
                    @if (getDoctorById(id); as d) {
                      <button
                        type="button"
                        class="dispatch-accept-btn"
                        [disabled]="d.status !== 'available'"
                        (click)="acceptForDoctor(d)"
                      >
                        <span class="avatar">{{ d.initials }}</span>
                        <span>
                          <strong>Accept — {{ d.name }}</strong>
                          <small>{{ d.specialty }} · {{ d.area }}</small>
                        </span>
                      </button>
                    }
                  }
                </div>
              }
            } @else {
              <div class="dispatch-accepted-info">
                <span class="status-pill status-pill--accepted">Accepted</span>
                <p>Assigned to <strong>{{ b.assignedDoctor }}</strong></p>
              </div>
            }

            <h4 class="dispatch-section-title">Activity Log</h4>
            <ul class="timeline">
              @for (e of b.history; track e.time + e.label) {
                <li [class.pending]="!e.done">
                  <strong>{{ e.time }}</strong> — {{ e.label }}
                </li>
              }
            </ul>
          }
        </div>
      </div>
    </div>
  `,
})
export class DispatchComponent {
  readonly emergencySla = getEmergencySlaLabel;
  readonly formatDistance = formatDistance;
  readonly bookingGeo = bookingGeo;

  readonly queue = signal(
    sortBookingsByPriority(BOOKINGS.filter((b) => ['pending', 'sent'].includes(b.status))),
  );

  readonly selected = signal<Booking | null>(
    sortBookingsByPriority(BOOKINGS.filter((b) => ['pending', 'sent'].includes(b.status)))[0] ?? null,
  );

  readonly selectedDoctors = signal<Set<string>>(new Set());
  readonly sentDoctorIds = signal<string[]>([]);
  readonly selectedMapId = signal<string | null>(null);

  readonly mapMarkers = computed((): BangaloreMapMarker[] => {
    const booking = this.selected();
    if (!booking) return [];
    return buildDispatchMapMarkers(booking, DOCTORS, VEHICLES);
  });

  readonly clientArea = computed(() => {
    const b = this.selected();
    return b ? bookingGeo(b).area : '—';
  });

  readonly nearbyDoctors = computed((): DoctorWithDistance[] => {
    const booking = this.selected();
    if (!booking) return [];
    const client = bookingGeo(booking);
    return DOCTORS.filter((d) => d.status !== 'offline')
      .map((d) => {
        const geo = doctorGeo(d);
        if (!geo) return null;
        const km = distanceKm(client, geo);
        return { ...d, computedDistanceKm: km, etaMin: estimateEtaMinutes(km) };
      })
      .filter((d): d is DoctorWithDistance => d != null)
      .sort((a, b) => a.computedDistanceKm - b.computedDistanceKm)
      .slice(0, 5);
  });

  readonly nearbyVehicles = computed(() => {
    const booking = this.selected();
    if (!booking) return [];
    const client = bookingGeo(booking);
    return VEHICLES.filter((v) => v.status === 'available' || v.status === 'on-trip')
      .map((v) => {
        const geo = vehicleGeo(v);
        if (!geo) return null;
        const km = distanceKm(client, geo);
        return {
          ...v,
          distanceKm: km,
          etaMin: estimateEtaMinutes(km),
        };
      })
      .filter((v): v is NonNullable<typeof v> => v != null)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  });

  readonly nearestDoctorLabel = computed(() => {
    const d = this.nearbyDoctors()[0];
    if (!d) return '—';
    return `${d.name} · ${formatDistance(d.computedDistanceKm)}`;
  });

  readonly nearestVehicleLabel = computed(() => {
    const v = this.nearbyVehicles()[0];
    if (!v) return '—';
    return `${v.id} · ${formatDistance(v.distanceKm)}`;
  });

  readonly bannerType = computed(() => {
    const b = this.selected();
    if (!b) return 'pending';
    if (b.status === 'accepted') return 'accepted';
    if (b.status === 'sent') return 'sent';
    return 'pending';
  });

  readonly bannerMessage = computed(() => {
    const type = this.bannerType();
    if (type === 'accepted') return '✓ Doctor accepted — booking status updated';
    if (type === 'sent') return 'Request sent — waiting for doctor or admin acceptance';
    return 'Awaiting dispatch — select nearby doctors on the map';
  });

  getDoctorById(id: string): Doctor | undefined {
    return DOCTORS.find((d) => d.id === id);
  }

  selectBooking(b: Booking): void {
    this.selected.set(b);
    this.selectedMapId.set(b.id);
    this.selectedDoctors.set(new Set(b.requestedDoctorIds ?? []));
    this.sentDoctorIds.set(b.requestedDoctorIds ?? []);
  }

  onMapMarkerSelect(id: string): void {
    this.selectedMapId.set(id);
    const doctor = DOCTORS.find((d) => d.id === id);
    if (doctor && doctor.status === 'available') {
      this.toggleDoctor(id, doctor.status);
    }
  }

  toggleDoctor(id: string, status: Doctor['status']): void {
    if (status !== 'available') return;
    const next = new Set(this.selectedDoctors());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedDoctors.set(next);
  }

  sendRequest(): void {
    const b = this.selected();
    if (!b || this.selectedDoctors().size === 0) return;

    const doctorIds = [...this.selectedDoctors()];
    this.sentDoctorIds.set(doctorIds);

    const names = doctorIds
      .map((id) => DOCTORS.find((d) => d.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    b.status = 'sent';
    b.requestedDoctorIds = doctorIds;
    b.history.push({
      time: 'Now',
      label: `Request sent to ${names}`,
      done: true,
    });
    b.history.push({
      time: '—',
      label: 'Waiting for doctor or admin acceptance',
      done: false,
    });

    this.refreshQueue();
  }

  acceptForDoctor(doctor: Doctor): void {
    const b = this.selected();
    if (!b || doctor.status !== 'available') return;

    acceptBookingForDoctor(b, doctor, true);
    this.refreshQueue();
    this.selected.set(b);
    this.sentDoctorIds.set([]);
    this.selectedDoctors.set(new Set());
  }

  private refreshQueue(): void {
    this.queue.set(
      sortBookingsByPriority(BOOKINGS.filter((bk) => ['pending', 'sent'].includes(bk.status))),
    );
  }
}
