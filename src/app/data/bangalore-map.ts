/** Bangalore map utilities — coords, areas, distance */

export interface GeoPoint {
  lat: number;
  lng: number;
  area: string;
}

export interface MapPoint {
  x: number;
  y: number;
  area: string;
  lat: number;
  lng: number;
}

export const BANGALORE_BOUNDS = {
  minLat: 12.82,
  maxLat: 13.05,
  minLng: 77.52,
  maxLng: 77.78,
  label: 'Bangalore',
};

export const BANGALORE_AREAS: { name: string; lat: number; lng: number }[] = [
  { name: 'Hebbal', lat: 13.0358, lng: 77.597 },
  { name: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { name: 'MG Road', lat: 12.9756, lng: 77.6064 },
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { name: 'HSR Layout', lat: 12.9121, lng: 77.6446 },
  { name: 'Jayanagar', lat: 12.925, lng: 77.5938 },
  { name: 'Marathahalli', lat: 12.9591, lng: 77.6974 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7499 },
  { name: 'Electronic City', lat: 12.8456, lng: 77.6603 },
];

export function coordsToMapPercent(lat: number, lng: number): { x: number; y: number } {
  const { minLat, maxLat, minLng, maxLng } = BANGALORE_BOUNDS;
  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
  return {
    x: Math.min(96, Math.max(4, x)),
    y: Math.min(94, Math.max(6, y)),
  };
}

export function toMapPoint(geo: GeoPoint): MapPoint {
  const { x, y } = coordsToMapPercent(geo.lat, geo.lng);
  return { x, y, area: geo.area, lat: geo.lat, lng: geo.lng };
}

/** Haversine distance in kilometres */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function estimateEtaMinutes(km: number): number {
  const avgSpeedKmh = 22;
  return Math.max(5, Math.round((km / avgSpeedKmh) * 60));
}
