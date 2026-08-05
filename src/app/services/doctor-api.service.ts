import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Booking } from '../models/booking.model';
import { Doctor, DoctorForm, DoctorProfilePeriod } from '../models/doctor.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: Record<string, unknown>;
}

export type { DoctorProfilePeriod } from '../models/doctor.model';

export interface DoctorStats {
  total: number;
  pending: number;
  completed: number;
  active: number;
  patients: number;
}

@Injectable({ providedIn: 'root' })
export class DoctorApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/doctors`;

  list(status?: string): Observable<Doctor[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<Doctor[]>>(this.base, { params }).pipe(map((res) => this.unwrap(res)));
  }

  create(form: DoctorForm): Observable<Doctor> {
    return this.http.post<ApiResponse<Doctor>>(this.base, form).pipe(map((res) => this.unwrap(res)));
  }

  getById(id: string): Observable<Doctor> {
    return this.http
      .get<ApiResponse<Doctor>>(`${this.base}/${encodeURIComponent(id)}`)
      .pipe(map((res) => this.unwrap(res)));
  }

  update(id: string, form: Partial<DoctorForm>): Observable<Doctor> {
    return this.http
      .patch<ApiResponse<Doctor>>(`${this.base}/${encodeURIComponent(id)}`, form)
      .pipe(map((res) => this.unwrap(res)));
  }

  setAvailability(id: string, status: Doctor['status']): Observable<Doctor> {
    return this.http
      .patch<ApiResponse<Doctor>>(`${this.base}/${encodeURIComponent(id)}/availability`, { status })
      .pipe(map((res) => this.unwrap(res)));
  }

  getStats(id: string, period: DoctorProfilePeriod = 'today'): Observable<DoctorStats> {
    const params = new HttpParams().set('period', period);
    return this.http
      .get<ApiResponse<DoctorStats>>(`${this.base}/${encodeURIComponent(id)}/stats`, { params })
      .pipe(map((res) => this.unwrap(res)));
  }

  getBookings(id: string, period?: DoctorProfilePeriod): Observable<Booking[]> {
    let params = new HttpParams();
    if (period) params = params.set('period', period);
    return this.http
      .get<ApiResponse<Booking[]>>(`${this.base}/${encodeURIComponent(id)}/bookings`, { params })
      .pipe(map((res) => this.unwrap(res)));
  }

  getRequests(id: string): Observable<Booking[]> {
    return this.http
      .get<ApiResponse<Booking[]>>(`${this.base}/${encodeURIComponent(id)}/requests`)
      .pipe(map((res) => this.unwrap(res)));
  }

  acceptRequest(bookingId: string, doctorId: string): Observable<Booking> {
    return this.http
      .post<ApiResponse<Booking>>(`${environment.apiUrl}/bookings/${encodeURIComponent(bookingId)}/accept`, {
        doctorId,
      })
      .pipe(map((res) => this.unwrap(res)));
  }

  declineRequest(bookingId: string, doctorId: string): Observable<Booking> {
    return this.http
      .post<ApiResponse<Booking>>(`${environment.apiUrl}/bookings/${encodeURIComponent(bookingId)}/decline`, {
        doctorId,
      })
      .pipe(map((res) => this.unwrap(res)));
  }

  private unwrap<T>(res: ApiResponse<T>): T {
    if (!res.success || res.data === undefined) {
      throw new Error(res.message || 'Request failed');
    }
    return res.data;
  }
}
