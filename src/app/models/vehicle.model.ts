export type VehicleStatus = 'available' | 'on-trip' | 'maintenance' | 'unavailable';

export interface Vehicle {
  id: string;
  driver?: string;
  assignedDoctor?: string;
  status: VehicleStatus;
  area?: string;
  lat?: number;
  lng?: number;
  ridesToday: number;
  kmToday: number;
  fuelPercent: number;
}

export interface VehicleForm {
  driver: string;
  status: VehicleStatus;
  area: string;
  lat?: number;
  lng?: number;
  ridesToday: number;
  kmToday: number;
  fuelPercent: number;
}

export const VEHICLE_STATUS_OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'on-trip', label: 'On Trip' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'unavailable', label: 'Unavailable' },
];

export function createEmptyVehicleForm(): VehicleForm {
  return {
    driver: '',
    status: 'available',
    area: '',
    ridesToday: 0,
    kmToday: 0,
    fuelPercent: 100,
  };
}

export function vehicleToForm(vehicle: Vehicle): VehicleForm {
  return {
    driver: vehicle.driver ?? '',
    status: vehicle.status,
    area: vehicle.area ?? '',
    lat: vehicle.lat,
    lng: vehicle.lng,
    ridesToday: vehicle.ridesToday,
    kmToday: vehicle.kmToday,
    fuelPercent: vehicle.fuelPercent,
  };
}
