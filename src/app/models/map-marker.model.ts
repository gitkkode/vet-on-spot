export type MapMarkerType = 'doctor' | 'vehicle' | 'customer';

export interface MapMarker {
  id: string;
  type: MapMarkerType;
  x: number;
  y: number;
  label: string;
  status: string;
}
