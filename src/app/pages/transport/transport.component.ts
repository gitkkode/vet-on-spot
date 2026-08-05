import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BANGALORE_AREAS } from '../../data/bangalore-map';
import {
  createEmptyVehicleForm,
  Vehicle,
  VehicleForm,
  VEHICLE_STATUS_OPTIONS,
  VehicleStatus,
  vehicleToForm,
} from '../../models/vehicle.model';
import { getFuelLevelClass } from '../../utils/vehicle.utils';
import { VehicleApiService, VehicleSummary } from '../../services/vehicle-api.service';
import { IconComponent } from '../../components/icon/icon.component';
import { toPickerOptions } from '../../components/picker/picker.utils';
import { PickerOption } from '../../components/picker/picker.types';
import { VosSelectComponent } from '../../components/picker/vos-select.component';

const EMPTY_SUMMARY: VehicleSummary = {
  availableCount: 0,
  totalRides: 0,
  totalKm: 0,
  avgFuel: 0,
  count: 0,
};

type VehicleFilter = 'all' | VehicleStatus;

@Component({
  selector: 'app-transport',
  imports: [FormsModule, IconComponent, VosSelectComponent],
  template: `
    <div class="transport-page">
      <div class="page-header transport-page__header">
        <div>
          <h1>Transport Management</h1>
          <p>Track and manage fleet vehicles for doctor home visits</p>
        </div>
        <button type="button" class="btn-primary transport-page__add-btn" (click)="openAddVehicle()">
          <app-icon name="plus" size="sm" />
          Add Vehicle
        </button>
      </div>

      <div class="grid-4 transport-stats">
        <div class="stat-card">
          <div class="stat-card__label">Vehicles Available</div>
          <div class="stat-card__value">{{ summary().availableCount }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Rides Today</div>
          <div class="stat-card__value">{{ summary().totalRides }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Total Km Today</div>
          <div class="stat-card__value">{{ summary().totalKm }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">Avg Fuel Level</div>
          <div class="stat-card__value">{{ summary().avgFuel }}%</div>
        </div>
      </div>

      <div class="filter-bar">
        @for (f of filters; track f.key) {
          <button type="button" [class.active]="activeFilter() === f.key" (click)="activeFilter.set(f.key)">
            {{ f.label }}
          </button>
        }
      </div>

      @if (loadError()) {
        <p class="transport-page__error">{{ loadError() }}</p>
      } @else if (loading()) {
        <p class="transport-page__loading">Loading vehicles…</p>
      }

      <div class="vehicle-table">
        <div class="card" style="padding: 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Assigned Doctor</th>
                <th>Area</th>
                <th>Status</th>
                <th>Rides Today</th>
                <th>Km Today</th>
                <th>Fuel</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (v of filteredVehicles(); track v.id) {
                <tr>
                  <td><strong>{{ v.id }}</strong></td>
                  <td>{{ v.driver ?? '—' }}</td>
                  <td>{{ v.assignedDoctor ?? '—' }}</td>
                  <td>{{ v.area ?? '—' }}</td>
                  <td>
                    <div class="transport-page__status-cell" (click)="$event.stopPropagation()">
                      <app-vos-select
                        [options]="statusOptions"
                        panelTitle="Status"
                        placeholder="Select status"
                        [ngModel]="v.status"
                        (ngModelChange)="updateVehicleStatus(v, $event)"
                      />
                    </div>
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
                    <button type="button" class="btn-outline" style="padding: 6px 12px; font-size: 12px" (click)="openEditVehicle(v)">
                      Edit
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" style="padding: 24px; text-align: center; color: #9aabb8">
                    No vehicles yet. Click <strong>Add Vehicle</strong> to register your first fleet unit.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    @if (vehicleModalOpen()) {
      <div class="modal-backdrop" (click)="closeVehicleModal()"></div>
      <div class="doctor-modal" role="dialog" [attr.aria-labelledby]="editingVehicleId() ? 'edit-vehicle-title' : 'add-vehicle-title'" (mousedown)="$event.stopPropagation()">
        <header class="doctor-modal__header">
          <div>
            <h2 [id]="editingVehicleId() ? 'edit-vehicle-title' : 'add-vehicle-title'">
              {{ editingVehicleId() ? 'Edit Vehicle' : 'Add Vehicle' }}
            </h2>
            <p>{{ editingVehicleId() ? 'Update fleet unit details' : 'Register a new vehicle in the fleet' }}</p>
          </div>
          <button type="button" class="doctor-modal__close" (click)="closeVehicleModal()" aria-label="Close">
            <app-icon name="close" size="md" />
          </button>
        </header>

        <div class="doctor-modal__body">
          @if (formError()) {
            <div class="doctor-modal__error">{{ formError() }}</div>
          }
          <div class="doctor-form-grid">
            <label class="form-field">
              <span>Driver Name</span>
              <input type="text" placeholder="e.g. Raj Patel" [(ngModel)]="vehicleForm.driver" />
            </label>
            <label class="form-field">
              <span>Status *</span>
              <app-vos-select
                [options]="statusOptions"
                panelTitle="Status"
                placeholder="Select status"
                [(ngModel)]="vehicleForm.status"
              />
            </label>
            <label class="form-field">
              <span>Area</span>
              <app-vos-select
                [options]="areaOptions"
                panelTitle="Area"
                placeholder="Select area"
                [(ngModel)]="vehicleForm.area"
                (ngModelChange)="onAreaChange($event)"
              />
            </label>
            <label class="form-field">
              <span>Fuel Level (%)</span>
              <input type="number" min="0" max="100" step="1" [(ngModel)]="vehicleForm.fuelPercent" />
            </label>
            <label class="form-field">
              <span>Rides Today</span>
              <input type="number" min="0" step="1" [(ngModel)]="vehicleForm.ridesToday" />
            </label>
            <label class="form-field">
              <span>Km Today</span>
              <input type="number" min="0" step="1" [(ngModel)]="vehicleForm.kmToday" />
            </label>
          </div>
        </div>

        <footer class="doctor-modal__footer">
          <button type="button" class="btn-outline" (click)="closeVehicleModal()">Cancel</button>
          <button type="button" class="btn-primary" [disabled]="saving()" (click)="saveVehicle()">
            {{ editingVehicleId() ? 'Save Changes' : 'Add Vehicle' }}
          </button>
        </footer>
      </div>
    }
  `,
})
export class TransportComponent implements OnInit {
  private readonly vehicleApi = inject(VehicleApiService);

  readonly filters: { key: VehicleFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'available', label: 'Available' },
    { key: 'on-trip', label: 'On Trip' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'unavailable', label: 'Unavailable' },
  ];

  readonly statusOptions: PickerOption[] = [
    { value: '', label: 'Select status' },
    ...VEHICLE_STATUS_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  ];
  readonly areaOptions = toPickerOptions(
    BANGALORE_AREAS.map((area) => area.name),
    'Select area',
  );

  readonly vehicles = signal<Vehicle[]>([]);
  readonly summary = signal<VehicleSummary>({ ...EMPTY_SUMMARY });
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly saving = signal(false);
  readonly vehicleModalOpen = signal(false);
  readonly editingVehicleId = signal<string | null>(null);
  readonly formError = signal('');
  readonly activeFilter = signal<VehicleFilter>('all');
  readonly fuelClass = getFuelLevelClass;

  vehicleForm: VehicleForm = createEmptyVehicleForm();

  readonly filteredVehicles = computed(() => {
    const filter = this.activeFilter();
    const list = this.vehicles();
    if (filter === 'all') return list;
    return list.filter((vehicle) => vehicle.status === filter);
  });

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const [vehicles, summary] = await Promise.all([
        firstValueFrom(this.vehicleApi.list()),
        firstValueFrom(this.vehicleApi.getSummary()),
      ]);
      this.vehicles.set(vehicles);
      this.summary.set(summary);
    } catch {
      this.vehicles.set([]);
      this.summary.set({ ...EMPTY_SUMMARY });
      this.loadError.set('Could not load vehicles from the server.');
    } finally {
      this.loading.set(false);
    }
  }

  openAddVehicle(): void {
    this.editingVehicleId.set(null);
    this.vehicleForm = createEmptyVehicleForm();
    this.formError.set('');
    this.vehicleModalOpen.set(true);
  }

  openEditVehicle(vehicle: Vehicle): void {
    this.editingVehicleId.set(vehicle.id);
    this.vehicleForm = vehicleToForm(vehicle);
    this.formError.set('');
    this.vehicleModalOpen.set(true);
  }

  closeVehicleModal(): void {
    if (this.saving()) return;
    this.vehicleModalOpen.set(false);
    this.formError.set('');
  }

  onAreaChange(areaName: string): void {
    const match = BANGALORE_AREAS.find((area) => area.name === areaName);
    if (!match) return;
    this.vehicleForm = {
      ...this.vehicleForm,
      area: match.name,
      lat: match.lat,
      lng: match.lng,
    };
  }

  async saveVehicle(): Promise<void> {
    if (!VEHICLE_STATUS_OPTIONS.some((option) => option.value === this.vehicleForm.status)) {
      this.formError.set('Please select a valid status.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');
    try {
      const payload: VehicleForm = { ...this.vehicleForm };
      const editingId = this.editingVehicleId();
      if (editingId) {
        await firstValueFrom(this.vehicleApi.update(editingId, payload));
      } else {
        await firstValueFrom(this.vehicleApi.create(payload));
      }
      this.vehicleModalOpen.set(false);
      await this.load();
    } catch (error) {
      const err = error as Error;
      this.formError.set(err.message || 'Could not save vehicle.');
    } finally {
      this.saving.set(false);
    }
  }

  updateVehicleStatus(vehicle: Vehicle, status: VehicleStatus): void {
    if (!status || status === vehicle.status) return;
    void this.saveVehicleStatus(vehicle.id, status);
  }

  private async saveVehicleStatus(id: string, status: VehicleStatus): Promise<void> {
    try {
      const updated = await firstValueFrom(this.vehicleApi.setStatus(id, status));
      this.vehicles.update((list) => list.map((v) => (v.id === id ? updated : v)));
      const summary = await firstValueFrom(this.vehicleApi.getSummary());
      this.summary.set(summary);
    } catch {
      await this.load();
    }
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
