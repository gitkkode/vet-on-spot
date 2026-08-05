import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Booking } from '../models/booking.model';
import { AppointmentSectionId, PetAppointmentForm } from '../models/appointment-form.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: Record<string, unknown>;
}

export interface BookingListParams {
  status?: string;
  type?: string;
  search?: string;
  scheduledDate?: string;
  dateFrom?: string;
  dateTo?: string;
  isEmergency?: boolean;
  limit?: number;
}

export interface PetVisitSummary {
  id: string;
  displayId?: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  status: string | null;
  reason: string | null;
  service: string | null;
  assignedDoctorName: string | null;
}

export interface PetMedicationSummary {
  bookingId: string;
  displayId?: string;
  scheduledDate: string | null;
  medications: {
    medicineName?: string;
    dosage?: string;
    sinceWhen?: string;
    supplements?: string;
  };
}

export interface CalendarDaySummary {
  date: string;
  count: number;
  hasEmergency: boolean;
}

export interface CalendarMonthResponse {
  month: string;
  days: CalendarDaySummary[];
}

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/bookings`;

  create(form: PetAppointmentForm, validate = true): Observable<Booking> {
    const params = validate ? undefined : new HttpParams().set('validate', 'false');
    return this.http.post<ApiResponse<Booking>>(this.base, form, { params }).pipe(map((res) => this.unwrap(res)));
  }

  update(id: string, form: PetAppointmentForm, options?: { validate?: boolean }): Observable<Booking> {
    let params = new HttpParams();
    if (options?.validate) {
      params = params.set('validate', 'true');
    }
    return this.http
      .patch<ApiResponse<Booking>>(`${this.base}/${encodeURIComponent(id)}`, form, { params })
      .pipe(map((res) => this.unwrap(res)));
  }

  finalize(id: string, form?: PetAppointmentForm): Observable<Booking> {
    return this.http
      .post<ApiResponse<Booking>>(`${this.base}/${encodeURIComponent(id)}/finalize`, form || {})
      .pipe(map((res) => this.unwrap(res)));
  }

  cancel(id: string, reason?: string): Observable<Booking> {
    return this.http
      .post<ApiResponse<Booking>>(`${this.base}/${encodeURIComponent(id)}/cancel`, { reason: reason || undefined })
      .pipe(map((res) => this.unwrap(res)));
  }

  complete(id: string): Observable<Booking> {
    return this.http
      .post<ApiResponse<Booking>>(`${this.base}/${encodeURIComponent(id)}/complete`, {})
      .pipe(map((res) => this.unwrap(res)));
  }

  patchIntake(id: string, section: AppointmentSectionId, data: unknown): Observable<Booking> {
    return this.http
      .patch<ApiResponse<Booking>>(`${this.base}/${encodeURIComponent(id)}/intake`, { section, data })
      .pipe(map((res) => this.unwrap(res)));
  }

  getById(id: string): Observable<Booking> {
    return this.http
      .get<ApiResponse<Booking>>(`${this.base}/${encodeURIComponent(id)}`)
      .pipe(map((res) => this.unwrap(res)));
  }

  list(params: BookingListParams = {}): Observable<Booking[]> {
    let httpParams = new HttpParams();
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.scheduledDate) httpParams = httpParams.set('scheduledDate', params.scheduledDate);
    if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
    if (params.isEmergency) httpParams = httpParams.set('isEmergency', 'true');
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));

    return this.http.get<ApiResponse<Booking[]>>(this.base, { params: httpParams }).pipe(map((res) => this.unwrap(res)));
  }

  getVisitHistory(ownerId: string, petId: string): Observable<PetVisitSummary[]> {
    return this.http
      .get<ApiResponse<PetVisitSummary[]>>(
        `${environment.apiUrl}/pets/${encodeURIComponent(ownerId)}/${encodeURIComponent(petId)}/visit-history`,
      )
      .pipe(map((res) => this.unwrap(res)));
  }

  getMedicationHistory(ownerId: string, petId: string): Observable<PetMedicationSummary[]> {
    return this.http
      .get<ApiResponse<PetMedicationSummary[]>>(
        `${environment.apiUrl}/pets/${encodeURIComponent(ownerId)}/${encodeURIComponent(petId)}/medication-history`,
      )
      .pipe(map((res) => this.unwrap(res)));
  }

  getCalendarMonth(month: string): Observable<CalendarMonthResponse> {
    const params = new HttpParams().set('month', month);
    return this.http
      .get<ApiResponse<CalendarMonthResponse>>(`${this.base}/calendar`, { params })
      .pipe(map((res) => this.unwrap(res)));
  }

  getPreviousVisits(bookingId: string): Observable<PetVisitSummary[]> {
    return this.http
      .get<ApiResponse<PetVisitSummary[]>>(`${this.base}/${encodeURIComponent(bookingId)}/previous-visits`)
      .pipe(map((res) => this.unwrap(res)));
  }

  private unwrap<T>(res: ApiResponse<T>): T {
    if (!res.success || res.data === undefined) {
      const err = new Error(res.message || 'Request failed') as Error & { errors?: string[] };
      err.errors = res.errors;
      throw err;
    }
    return res.data;
  }
}
