import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Booking } from '../../models/booking.model';
import {
  BangaloreMapComponent,
  BangaloreMapMarker,
} from '../../components/bangalore-map/bangalore-map.component';
import { formatDistance } from '../../data/map-markers';
import { IconComponent } from '../../components/icon/icon.component';
import { MapApiService, MapDistanceRow } from '../../services/map-api.service';

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
                  <span>{{ b.area ?? '—' }}</span>
                  <span class="status-pill status-pill--{{ b.status }}">{{ b.status }}</span>
                </span>
              </button>
            }
          </div>

          @if (focusBooking(); as fb) {
            <div class="map-sidebar__distances">
              <h4>Distance from {{ fb.petName }} ({{ fb.area ?? clientArea() }})</h4>
              @for (row of distanceRowsView(); track row.id) {
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
export class LiveMapComponent implements OnInit {
  private readonly mapApi = inject(MapApiService);

  readonly formatDistance = formatDistance;

  readonly showDoctors = signal(true);
  readonly showVehicles = signal(true);
  readonly showCustomers = signal(true);
  readonly focusBookingId = signal<string | null>(null);
  readonly selectedMapId = signal<string | null>(null);
  readonly markers = signal<BangaloreMapMarker[]>([]);
  readonly activeBookings = signal<Booking[]>([]);
  readonly distanceRows = signal<MapDistanceRow[]>([]);
  readonly clientArea = signal('—');
  readonly loading = signal(true);

  readonly focusBooking = computed(() => {
    const id = this.focusBookingId();
    return id ? this.activeBookings().find((b) => b.id === id) : undefined;
  });

  readonly enrichedMarkers = computed(() => {
    const markers = this.markers();
    const focus = this.focusBookingId();
    if (!focus) return markers;

    const rowMap = new Map(this.distanceRows().map((r) => [r.id, r]));
    return markers.map((m) => {
      if (m.type === 'customer' || m.id === focus) return m;
      const row = rowMap.get(m.id);
      if (!row) return m;
      return { ...m, distanceKm: row.distanceKm, etaMin: row.etaMin };
    });
  });

  readonly visibleMarkers = computed(() =>
    this.enrichedMarkers().filter((m) => {
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

  readonly doctorCount = computed(() => this.markers().filter((m) => m.type === 'doctor').length);
  readonly vehicleCount = computed(() => this.markers().filter((m) => m.type === 'vehicle').length);
  readonly bookingCount = computed(() => this.markers().filter((m) => m.type === 'customer').length);

  readonly distanceRowsView = computed(() =>
    this.distanceRows().map((row) => ({
      ...row,
      icon: (row.type === 'doctor' ? 'stethoscope' : 'truck') as 'stethoscope' | 'truck',
      distance: formatDistance(row.distanceKm),
      eta: row.etaMin,
    })),
  );

  ngOnInit(): void {
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.mapApi.getMarkers('doctors,vehicles,customers'));
      this.markers.set(data.markers);
      this.activeBookings.set(data.activeBookings);
      const first = data.activeBookings[0];
      if (first) {
        this.focusBookingId.set(first.id);
        this.selectedMapId.set(first.id);
        await this.loadDistances(first.id);
      }
    } catch {
      this.markers.set([]);
      this.activeBookings.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadDistances(bookingId: string): Promise<void> {
    try {
      const data = await firstValueFrom(this.mapApi.getDistances(bookingId));
      this.distanceRows.set(data.rows);
      this.clientArea.set(data.clientArea);
    } catch {
      this.distanceRows.set([]);
    }
  }

  toggleLayer(layer: LayerKey): void {
    if (layer === 'doctors') this.showDoctors.update((v) => !v);
    if (layer === 'vehicles') this.showVehicles.update((v) => !v);
    if (layer === 'customers') this.showCustomers.update((v) => !v);
  }

  selectBookingFocus(b: Booking): void {
    this.focusBookingId.set(b.id);
    this.selectedMapId.set(b.id);
    void this.loadDistances(b.id);
  }

  onMarkerSelect(id: string): void {
    this.selectedMapId.set(id);
    const booking = this.activeBookings().find((b) => b.id === id);
    if (booking) {
      this.focusBookingId.set(id);
      void this.loadDistances(id);
    }
  }

  markerStatusClass(m: BangaloreMapMarker): string {
    if (m.type === 'doctor' && m.status === 'available') return 'available';
    if (m.type === 'doctor' && m.status === 'on-visit') return 'on-trip';
    if (m.status === 'pending') return 'pending';
    if (m.status === 'accepted') return 'accepted';
    return 'sent';
  }
}
