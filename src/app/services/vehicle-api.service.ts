import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Vehicle, VehicleForm, VehicleStatus } from '../models/vehicle.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface VehicleSummary {
  availableCount: number;
  totalRides: number;
  totalKm: number;
  avgFuel: number;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class VehicleApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/vehicles`;

  list(status?: VehicleStatus): Observable<Vehicle[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<Vehicle[]>>(this.base, { params }).pipe(map((res) => this.unwrap(res)));
  }

  getSummary(): Observable<VehicleSummary> {
    return this.http
      .get<ApiResponse<VehicleSummary>>(`${this.base}/summary`)
      .pipe(map((res) => this.unwrap(res)));
  }

  getById(id: string): Observable<Vehicle> {
    return this.http
      .get<ApiResponse<Vehicle>>(`${this.base}/${encodeURIComponent(id)}`)
      .pipe(map((res) => this.unwrap(res)));
  }

  create(form: VehicleForm): Observable<Vehicle> {
    return this.http.post<ApiResponse<Vehicle>>(this.base, form).pipe(map((res) => this.unwrap(res)));
  }

  update(id: string, form: Partial<VehicleForm>): Observable<Vehicle> {
    return this.http
      .patch<ApiResponse<Vehicle>>(`${this.base}/${encodeURIComponent(id)}`, form)
      .pipe(map((res) => this.unwrap(res)));
  }

  setStatus(id: string, status: VehicleStatus): Observable<Vehicle> {
    return this.http
      .patch<ApiResponse<Vehicle>>(`${this.base}/${encodeURIComponent(id)}/status`, { status })
      .pipe(map((res) => this.unwrap(res)));
  }

  assign(id: string, payload: { doctorId?: string; bookingId?: string }): Observable<Vehicle> {
    return this.http
      .post<ApiResponse<Vehicle>>(`${this.base}/${encodeURIComponent(id)}/assign`, payload)
      .pipe(map((res) => this.unwrap(res)));
  }

  setLocation(id: string, lat: number, lng: number, area?: string): Observable<Vehicle> {
    return this.http
      .patch<ApiResponse<Vehicle>>(`${this.base}/${encodeURIComponent(id)}/location`, { lat, lng, area })
      .pipe(map((res) => this.unwrap(res)));
  }

  private unwrap<T>(res: ApiResponse<T>): T {
    if (!res.success || res.data === undefined) {
      throw new Error(res.message || 'Request failed');
    }
    return res.data;
  }
}
