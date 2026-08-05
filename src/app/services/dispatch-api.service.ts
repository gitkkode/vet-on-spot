import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Booking } from '../models/booking.model';
import { Doctor } from '../models/doctor.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: Record<string, unknown>;
}

export interface DoctorSuggestion extends Doctor {
  computedDistanceKm: number;
  etaMin: number;
}

export interface DispatchSuggestions {
  booking: Booking;
  doctors: DoctorSuggestion[];
  clientArea: string;
}

@Injectable({ providedIn: 'root' })
export class DispatchApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/dispatch`;

  getQueue(): Observable<Booking[]> {
    return this.http.get<ApiResponse<Booking[]>>(`${this.base}/queue`).pipe(map((res) => this.unwrap(res)));
  }

  getSuggestions(bookingId: string): Observable<DispatchSuggestions> {
    return this.http
      .get<ApiResponse<DispatchSuggestions>>(`${this.base}/suggestions/${encodeURIComponent(bookingId)}`)
      .pipe(map((res) => this.unwrap(res)));
  }

  assign(bookingId: string, doctorId: string): Observable<Booking> {
    return this.http
      .post<ApiResponse<Booking>>(`${environment.apiUrl}/bookings/${encodeURIComponent(bookingId)}/assign`, {
        doctorId,
      })
      .pipe(map((res) => this.unwrap(res)));
  }

  dispatch(bookingId: string, doctorIds: string[]): Observable<Booking> {
    return this.http
      .post<ApiResponse<Booking>>(`${environment.apiUrl}/bookings/${encodeURIComponent(bookingId)}/dispatch`, {
        doctorIds,
      })
      .pipe(map((res) => this.unwrap(res)));
  }

  adminAccept(bookingId: string, doctorId: string): Observable<Booking> {
    return this.http
      .post<ApiResponse<Booking>>(`${environment.apiUrl}/bookings/${encodeURIComponent(bookingId)}/admin-accept`, {
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
