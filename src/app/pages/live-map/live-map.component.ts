import { Component, computed, signal } from '@angular/core';
import {
  BOOKINGS,
  DOCTORS,
  VEHICLES,
  Booking,
  Doctor,
  Vehicle,
} from '../../data/mock-data';
import {
  BangaloreMapComponent,
  BangaloreMapMarker,
} from '../../components/bangalore-map/bangalore-map.component';
import {
  bookingGeo,
  buildLiveMapMarkers,
  distanceKm,
  doctorGeo,
  formatDistance,
  estimateEtaMinutes,
  vehicleGeo,
} from '../../data/map-markers';
import { IconComponent } from '../../components/icon/icon.component';

type LayerKey = 'doctors' | 'vehicles' | 'customers';

@Component({
  selector: 'app-live-map',
  imports: [IconComponent, BangaloreMapComponent],
  template: `
    <div class="live-map-page">
      <div class="page-header">
        <h1>Live Map</h1>
        <p>Bangalore — real-time doctors, fleet vehicles & active booking spots</p>
      </div>

      <div class="live-map-layout">
        <aside class="map-sidebar">
          <div class="map-filters">
            <h4>Map Layers</h4>
            <label>
              <input type="checkbox" [checked]="showDoctors()" (change)="toggleLayer('doctors')" />
              Doctors ({{ doctorCount() }})
            </label>
            <label>
              <input type="checkbox" [checked]="showVehicles()" (change)="toggleLayer('vehicles')" />
              Vehicles ({{ vehicleCount() }})
            </label>
            <label>
              <input type="checkbox" [checked]="showCustomers()" (change)="toggleLayer('customers')" />
              Bookings ({{ bookingCount() }})
            </label>
          </div>

          <div class="map-sidebar__list">
            <h4>Active Bookings</h4>
            @for (b of activeBookings(); track b.id) {
              <button
                type="button"
                class="map-sidebar__item"
                [class.map-sidebar__item--active]="focusBookingId() === b.id"
                (click)="selectBookingFocus(b)"
              >
                <span class="map-sidebar__item-icon pet-icon-wrap">
                  <app-icon [name]="b.petIcon" size="sm" />
                </span>
                <span class="map-sidebar__item-body">
                  <strong>{{ b.petName }} — {{ b.customerName }}</strong>
                  <span>{{ b.area ?? bookingGeo(b).area }}</span>
                  <span class="status-pill status-pill--{{ b.status }}">{{ b.status }}</span>
                </span>
              </button>
            }
          </div>

          @if (focusBooking(); as fb) {
            <div class="map-sidebar__distances">
              <h4>Distance from {{ fb.petName }} ({{ fb.area }})</h4>
              @for (row of distanceRows(); track row.id) {
                <div class="map-sidebar__dist-row map-sidebar__dist-row--{{ row.type }}">
                  <app-icon [name]="row.icon" size="sm" />
                  <div>
                    <strong>{{ row.label }}</strong>
                    <span>{{ row.area }}</span>
                  </div>
                  <em>{{ row.distance }} · ~{{ row.eta }} min</em>
                </div>
              }
            </div>
          }
        </aside>

        <div class="live-map-main">
          <app-bangalore-map
            [markers]="visibleMarkers()"
            [selectedId]="selectedMapId()"
            [showRadius]="!!focusBooking()"
            [showDistanceLines]="!!focusBooking()"
            (markerSelect)="onMarkerSelect($event)"
          />

          @if (selectedMarker(); as m) {
            <div class="map-container__info-bar">
              <div>
                <strong>{{ m.label }}</strong>
                @if (m.sublabel) {
                  <span class="map-container__info-sub">{{ m.sublabel }}</span>
                }
                <span class="map-container__info-area">{{ m.area }}</span>
                @if (m.distanceKm != null) {
                  <span class="map-container__info-dist">
                    {{ formatDistance(m.distanceKm) }} from client · ~{{ m.etaMin }} min
                  </span>
                }
                @if (m.status) {
                  <span class="status-pill status-pill--{{ markerStatusClass(m) }}">{{ m.status }}</span>
                }
              </div>
              @if (m.type === 'doctor') {
                <button type="button" class="btn-primary map-container__assign-btn">Assign to Booking</button>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class LiveMapComponent {
  readonly formatDistance = formatDistance;
  readonly bookingGeo = bookingGeo;

  readonly showDoctors = signal(true);
  readonly showVehicles = signal(true);
  readonly showCustomers = signal(true);
  readonly focusBookingId = signal<string | null>(
    BOOKINGS.find((b) => ['pending', 'accepted', 'sent'].includes(b.status))?.id ?? null,
  );
  readonly selectedMapId = signal<string | null>(null);

  readonly activeBookings = computed(() =>
    BOOKINGS.filter((b) => !['completed', 'cancelled'].includes(b.status)),
  );

  readonly focusBooking = computed(() => {
    const id = this.focusBookingId();
    return id ? BOOKINGS.find((b) => b.id === id) : undefined;
  });

  readonly allMarkers = computed(() => {
    const focus = this.focusBooking();
    const markers = buildLiveMapMarkers(
      BOOKINGS.filter((b) => !['completed', 'cancelled'].includes(b.status)),
      DOCTORS,
      VEHICLES,
    );
    if (!focus) return markers;
    const client = bookingGeo(focus);
    return markers.map((m) => {
      if (m.type === 'customer' || m.id === focus.id) return m;
      const entity =
        DOCTORS.find((d) => d.id === m.id) ??
        VEHICLES.find((v) => v.id === m.id);
      let geo;
      if (entity && 'specialty' in entity) geo = doctorGeo(entity as Doctor);
      else if (entity) geo = vehicleGeo(entity as Vehicle);
      else return m;
      if (!geo) return m;
      const km = distanceKm(client, geo);
      return { ...m, distanceKm: km, etaMin: estimateEtaMinutes(km) };
    });
  });

  readonly visibleMarkers = computed(() =>
    this.allMarkers().filter((m) => {
      if (m.type === 'doctor') return this.showDoctors();
      if (m.type === 'vehicle') return this.showVehicles();
      return this.showCustomers();
    }),
  );

  readonly selectedMarker = computed(() => {
    const id = this.selectedMapId();
    if (!id) return null;
    return this.visibleMarkers().find((m) => m.id === id) ?? null;
  });

  readonly doctorCount = computed(() => this.allMarkers().filter((m) => m.type === 'doctor').length);
  readonly vehicleCount = computed(() => this.allMarkers().filter((m) => m.type === 'vehicle').length);
  readonly bookingCount = computed(() => this.allMarkers().filter((m) => m.type === 'customer').length);

  readonly distanceRows = computed(() => {
    const fb = this.focusBooking();
    if (!fb) return [];
    const client = bookingGeo(fb);
    const rows: {
      id: string;
      type: string;
      icon: 'stethoscope' | 'truck';
      label: string;
      area: string;
      distance: string;
      eta: number;
      km: number;
    }[] = [];

    for (const d of DOCTORS.filter((doc) => doc.status !== 'offline')) {
      const geo = doctorGeo(d);
      if (!geo) continue;
      const km = distanceKm(client, geo);
      rows.push({
        id: d.id,
        type: 'doctor',
        icon: 'stethoscope',
        label: d.name,
        area: d.area ?? geo.area,
        distance: formatDistance(km),
        eta: estimateEtaMinutes(km),
        km,
      });
    }

    for (const v of VEHICLES.filter((veh) => veh.status === 'available' || veh.status === 'on-trip')) {
      const geo = vehicleGeo(v);
      if (!geo) continue;
      const km = distanceKm(client, geo);
      rows.push({
        id: v.id,
        type: 'vehicle',
        icon: 'truck',
        label: v.id,
        area: v.area ?? geo.area,
        distance: formatDistance(km),
        eta: estimateEtaMinutes(km),
        km,
      });
    }

    return rows.sort((a, b) => a.km - b.km);
  });

  toggleLayer(layer: LayerKey): void {
    if (layer === 'doctors') this.showDoctors.update((v) => !v);
    if (layer === 'vehicles') this.showVehicles.update((v) => !v);
    if (layer === 'customers') this.showCustomers.update((v) => !v);
  }

  selectBookingFocus(b: Booking): void {
    this.focusBookingId.set(b.id);
    this.selectedMapId.set(b.id);
  }

  onMarkerSelect(id: string): void {
    this.selectedMapId.set(id);
    const booking = BOOKINGS.find((b) => b.id === id);
    if (booking) this.focusBookingId.set(id);
  }

  markerStatusClass(m: BangaloreMapMarker): string {
    if (m.type === 'doctor' && m.status === 'available') return 'available';
    if (m.type === 'doctor' && m.status === 'on-visit') return 'on-trip';
    if (m.status === 'pending') return 'pending';
    if (m.status === 'accepted') return 'accepted';
    return 'sent';
  }
}
