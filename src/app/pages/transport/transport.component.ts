import { Component } from '@angular/core';
import { VEHICLES, getFuelLevelClass } from '../../data/mock-data';

@Component({
  selector: 'app-transport',
  template: `
    <div class="transport-page">
      <div class="page-header">
        <h1>Transport Management</h1>
        <p>Track vehicles for doctor home visits</p>
      </div>

      <div class="grid-4 transport-stats">
        <div class="stat-card">
          <div class="stat-card__label">Vehicles Available</div>
          <div class="stat-card__value">{{ availableCount }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Rides Today</div>
          <div class="stat-card__value">{{ totalRides }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Total Km Today</div>
          <div class="stat-card__value">{{ totalKm }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Avg Fuel Level</div>
          <div class="stat-card__value">{{ avgFuel }}%</div>
        </div>
      </div>

      <div class="vehicle-table">
        <div class="card" style="padding: 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Assigned Doctor</th>
                <th>Status</th>
                <th>Rides Today</th>
                <th>Km Today</th>
                <th>Fuel</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (v of vehicles; track v.id) {
                <tr>
                  <td><strong>{{ v.id }}</strong></td>
                  <td>{{ v.driver ?? '—' }}</td>
                  <td>{{ v.assignedDoctor ?? '—' }}</td>
                  <td>
                    <span class="status-pill status-pill--{{ vehicleStatusClass(v.status) }}">
                      {{ vehicleStatusLabel(v.status) }}
                    </span>
                  </td>
                  <td>{{ v.ridesToday }}</td>
                  <td>{{ v.kmToday }} km</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px">
                      <div class="fuel-bar" style="flex: 1">
                        <div
                          class="fuel-bar__fill fuel-bar__fill--{{ fuelClass(v.fuelPercent) }}"
                          [style.width.%]="v.fuelPercent"
                        ></div>
                      </div>
                      <span style="font-size: 12px; min-width: 36px">{{ v.fuelPercent }}%</span>
                    </div>
                  </td>
                  <td>
                    @if (v.status === 'on-trip') {
                      <button type="button" class="btn-outline">Track</button>
                    } @else if (v.status === 'available') {
                      <button type="button" class="btn-primary" style="padding: 6px 12px; font-size: 12px">
                        Assign
                      </button>
                    } @else {
                      <span style="color: #9aabb8; font-size: 13px">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class TransportComponent {
  readonly vehicles = VEHICLES;
  readonly fuelClass = getFuelLevelClass;

  get availableCount() {
    return this.vehicles.filter((v) => v.status === 'available').length;
  }

  get totalRides() {
    return this.vehicles.reduce((s, v) => s + v.ridesToday, 0);
  }

  get totalKm() {
    return this.vehicles.reduce((s, v) => s + v.kmToday, 0);
  }

  get avgFuel() {
    return Math.round(this.vehicles.reduce((s, v) => s + v.fuelPercent, 0) / this.vehicles.length);
  }

  vehicleStatusClass(status: string): string {
    const map: Record<string, string> = {
      available: 'available',
      'on-trip': 'on-trip',
      maintenance: 'pending',
      unavailable: 'cancelled',
    };
    return map[status] ?? 'completed';
  }

  vehicleStatusLabel(status: string): string {
    const map: Record<string, string> = {
      available: 'Available',
      'on-trip': 'On Trip',
      maintenance: 'Maintenance',
      unavailable: 'Unavailable',
    };
    return map[status] ?? status;
  }
}
