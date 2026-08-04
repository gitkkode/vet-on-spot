import {
  Booking,
  Doctor,
  Vehicle,
} from './mock-data';
import {
  BANGALORE_AREAS,
  distanceKm,
  estimateEtaMinutes,
  formatDistance,
  GeoPoint,
  toMapPoint,
} from './bangalore-map';
import { BangaloreMapMarker } from '../components/bangalore-map/bangalore-map.component';

function areaGeo(areaName: string): GeoPoint | undefined {
  const match = BANGALORE_AREAS.find(
    (a) => a.name.toLowerCase() === areaName.toLowerCase(),
  );
  if (!match) return undefined;
  return { lat: match.lat, lng: match.lng, area: match.name };
}

export function resolveGeo(
  entity: { area?: string; lat?: number; lng?: number; location: string },
  fallbackArea = 'Indiranagar',
): GeoPoint {
  if (entity.lat != null && entity.lng != null && entity.area) {
    return { lat: entity.lat, lng: entity.lng, area: entity.area };
  }
  if (entity.area) {
    const g = areaGeo(entity.area);
    if (g) return g;
  }
  for (const area of BANGALORE_AREAS) {
    if (entity.location.toLowerCase().includes(area.name.toLowerCase())) {
      return { lat: area.lat, lng: area.lng, area: area.name };
    }
  }
  const fallback = areaGeo(fallbackArea)!;
  return fallback;
}

export function bookingGeo(booking: Booking): GeoPoint {
  return resolveGeo(
    {
      area: booking.area,
      lat: booking.lat,
      lng: booking.lng,
      location: booking.location,
    },
    booking.type === 'online' ? 'Indiranagar' : 'Koramangala',
  );
}

export function doctorGeo(doctor: Doctor): GeoPoint | null {
  if (doctor.status === 'offline') return null;
  return resolveGeo(
    {
      area: doctor.area,
      lat: doctor.lat,
      lng: doctor.lng,
      location: doctor.location,
    },
    doctor.area ?? 'Indiranagar',
  );
}

export function vehicleGeo(vehicle: Vehicle): GeoPoint | null {
  if (vehicle.status === 'maintenance' || vehicle.status === 'unavailable') return null;
  if (vehicle.lat != null && vehicle.lng != null && vehicle.area) {
    return { lat: vehicle.lat, lng: vehicle.lng, area: vehicle.area };
  }
  return null;
}

function buildMarker(
  id: string,
  type: BangaloreMapMarker['type'],
  geo: GeoPoint,
  label: string,
  sublabel?: string,
  status?: string,
  origin?: GeoPoint,
): BangaloreMapMarker {
  const point = toMapPoint(geo);
  const km = origin ? distanceKm(origin, geo) : undefined;
  return {
    id,
    type,
    x: point.x,
    y: point.y,
    label,
    sublabel,
    area: geo.area,
    status,
    distanceKm: km,
    etaMin: km != null ? estimateEtaMinutes(km) : undefined,
  };
}

export function buildDispatchMapMarkers(
  booking: Booking,
  doctors: Doctor[],
  vehicles: Vehicle[],
): BangaloreMapMarker[] {
  const client = bookingGeo(booking);
  const markers: BangaloreMapMarker[] = [
    buildMarker(
      booking.id,
      'customer',
      client,
      `${booking.petName}`,
      booking.customerName,
      booking.status,
    ),
  ];

  for (const d of doctors) {
    const geo = doctorGeo(d);
    if (!geo) continue;
    markers.push(
      buildMarker(
        d.id,
        'doctor',
        geo,
        d.name,
        d.specialty,
        d.status,
        client,
      ),
    );
  }

  for (const v of vehicles) {
    const geo = vehicleGeo(v);
    if (!geo) continue;
    markers.push(
      buildMarker(
        v.id,
        'vehicle',
        geo,
        v.id,
        v.driver ?? v.assignedDoctor ?? v.status,
        v.status,
        client,
      ),
    );
  }

  return markers;
}

export function buildLiveMapMarkers(
  bookings: Booking[],
  doctors: Doctor[],
  vehicles: Vehicle[],
): BangaloreMapMarker[] {
  const markers: BangaloreMapMarker[] = [];

  for (const b of bookings) {
    if (b.type === 'online' && b.status === 'completed') continue;
    const geo = bookingGeo(b);
    markers.push(
      buildMarker(b.id, 'customer', geo, `${b.petName}`, b.customerName, b.status),
    );
  }

  for (const d of doctors) {
    const geo = doctorGeo(d);
    if (!geo) continue;
    markers.push(
      buildMarker(d.id, 'doctor', geo, d.name, d.specialty, d.status),
    );
  }

  for (const v of vehicles) {
    const geo = vehicleGeo(v);
    if (!geo) continue;
    markers.push(
      buildMarker(v.id, 'vehicle', geo, v.id, v.driver ?? 'Fleet unit', v.status),
    );
  }

  return markers;
}

export function distanceLabelFromClient(
  booking: Booking,
  geo: GeoPoint,
): string {
  return formatDistance(distanceKm(bookingGeo(booking), geo));
}

export { formatDistance, estimateEtaMinutes, distanceKm };
