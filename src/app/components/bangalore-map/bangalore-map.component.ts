import { Component, computed, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icon.types';
import {
  BANGALORE_AREAS,
  BANGALORE_BOUNDS,
  formatDistance,
} from '../../data/bangalore-map';

export interface BangaloreMapMarker {
  id: string;
  type: 'customer' | 'doctor' | 'vehicle';
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  area: string;
  status?: string;
  distanceKm?: number;
  etaMin?: number;
}

@Component({
  selector: 'app-bangalore-map',
  imports: [IconComponent],
  template: `
    <div class="blr-map">
      <div class="blr-map__topbar">
        <div class="blr-map__city">
          <app-icon name="map-pin" size="sm" />
          <strong>{{ cityLabel() }}</strong>
          <span>Live tracking</span>
        </div>
        @if (customerMarker(); as c) {
          <div class="blr-map__focus">
            Client: <strong>{{ c.area }}</strong>
          </div>
        }
      </div>

      <div class="blr-map__canvas">
        <div class="blr-map__grid"></div>
        <div class="blr-map__roads blr-map__roads--h"></div>
        <div class="blr-map__roads blr-map__roads--v"></div>
        <div class="blr-map__roads blr-map__roads--d1"></div>
        <div class="blr-map__roads blr-map__roads--d2"></div>

        @for (area of areaLabels; track area.name) {
          <span
            class="blr-map__area-label"
            [style.left.%]="area.x"
            [style.top.%]="area.y"
          >
            {{ area.name }}
          </span>
        }

        @if (showRadius()) {
          <div
            class="blr-map__radius"
            [style.left.%]="customerMarker()?.x ?? 50"
            [style.top.%]="customerMarker()?.y ?? 50"
          ></div>
        }

        @if (distanceLines().length > 0) {
          <svg class="blr-map__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            @for (line of distanceLines(); track line.id) {
              <line
                [attr.x1]="line.x1"
                [attr.y1]="line.y1"
                [attr.x2]="line.x2"
                [attr.y2]="line.y2"
                [class]="'blr-map__line blr-map__line--' + line.type"
              />
            }
          </svg>
        }

        @for (m of markers(); track m.id) {
          <button
            type="button"
            class="blr-map__pin blr-map__pin--{{ m.type }}"
            [class.blr-map__pin--selected]="selectedId() === m.id"
            [style.left.%]="m.x"
            [style.top.%]="m.y"
            (click)="onPinClick(m.id)"
          >
            <span class="blr-map__pin-icon">
              <app-icon [name]="pinIcon(m.type)" size="sm" />
            </span>
            <span class="blr-map__pin-card">
              <strong>{{ m.label }}</strong>
              @if (m.sublabel) {
                <span>{{ m.sublabel }}</span>
              }
              <em>{{ m.area }}</em>
              @if (m.distanceKm != null && m.type !== 'customer') {
                <span class="blr-map__pin-distance">
                  {{ formatDist(m.distanceKm) }}
                  @if (m.etaMin != null) {
                    · ~{{ m.etaMin }} min
                  }
                </span>
              }
            </span>
          </button>
        }
      </div>

      @if (legendItems().length > 0) {
        <div class="blr-map__legend">
          @for (item of legendItems(); track item.label) {
            <span class="blr-map__legend-item blr-map__legend-item--{{ item.type }}">
              {{ item.label }}: {{ item.count }}
            </span>
          }
        </div>
      }
    </div>
  `,
})
export class BangaloreMapComponent {
  readonly markers = input<BangaloreMapMarker[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly showRadius = input(false);
  readonly showDistanceLines = input(true);

  readonly cityLabel = computed(() => BANGALORE_BOUNDS.label);

  readonly areaLabels = BANGALORE_AREAS.map((a) => {
    const x = ((a.lng - BANGALORE_BOUNDS.minLng) / (BANGALORE_BOUNDS.maxLng - BANGALORE_BOUNDS.minLng)) * 100;
    const y = ((BANGALORE_BOUNDS.maxLat - a.lat) / (BANGALORE_BOUNDS.maxLat - BANGALORE_BOUNDS.minLat)) * 100;
    return { name: a.name, x, y };
  });

  readonly customerMarker = computed(() => this.markers().find((m) => m.type === 'customer'));

  readonly distanceLines = computed(() => {
    if (!this.showDistanceLines()) return [];
    const customer = this.customerMarker();
    if (!customer) return [];
    return this.markers()
      .filter((m) => m.type !== 'customer')
      .map((m) => ({
        id: `${customer.id}-${m.id}`,
        type: m.type,
        x1: customer.x,
        y1: customer.y,
        x2: m.x,
        y2: m.y,
      }));
  });

  readonly legendItems = computed(() => {
    const list = this.markers();
    const count = (type: BangaloreMapMarker['type']) => list.filter((m) => m.type === type).length;
    return [
      { type: 'customer' as const, label: 'Bookings', count: count('customer') },
      { type: 'doctor' as const, label: 'Doctors', count: count('doctor') },
      { type: 'vehicle' as const, label: 'Vehicles', count: count('vehicle') },
    ].filter((i) => i.count > 0);
  });

  readonly markerSelect = output<string>();

  formatDist = formatDistance;

  pinIcon(type: BangaloreMapMarker['type']): IconName {
    if (type === 'doctor') return 'stethoscope';
    if (type === 'vehicle') return 'truck';
    return 'map-pin';
  }

  onPinClick(id: string): void {
    this.markerSelect.emit(id);
  }
}
