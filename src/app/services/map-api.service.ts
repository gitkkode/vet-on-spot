import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Booking } from '../models/booking.model';
import { BangaloreMapMarker } from '../components/bangalore-map/bangalore-map.component';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface MapDistanceRow {
  id: string;
  type: 'doctor' | 'vehicle';
  label: string;
  area: string;
  distanceKm: number;
  etaMin: number;
}

export interface MapMarkersResponse {
  markers: BangaloreMapMarker[];
  activeBookings: Booking[];
}

export interface MapDistancesResponse {
  bookingId: string;
  clientArea: string;
  rows: MapDistanceRow[];
}

@Injectable({ providedIn: 'root' })
export class MapApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/map`;

  getMarkers(layers: string, focusBookingId?: string): Observable<MapMarkersResponse> {
    let params = new HttpParams().set('layers', layers);
    if (focusBookingId) params = params.set('focusBookingId', focusBookingId);
    return this.http
      .get<ApiResponse<MapMarkersResponse>>(`${this.base}/markers`, { params })
      .pipe(map((res) => this.unwrap(res)));
  }

  getDistances(bookingId: string): Observable<MapDistancesResponse> {
    return this.http
      .get<ApiResponse<MapDistancesResponse>>(`${this.base}/distances/${encodeURIComponent(bookingId)}`)
      .pipe(map((res) => this.unwrap(res)));
  }

  private unwrap<T>(res: ApiResponse<T>): T {
    if (!res.success || res.data === undefined) {
      throw new Error(res.message || 'Request failed');
    }
    return res.data;
  }
}
