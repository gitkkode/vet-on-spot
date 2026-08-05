import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { PaymentMethod, PaymentRecord, PaymentStatus } from '../models/payment.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface CreatePaymentPayload {
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  referenceNote?: string;
  status?: PaymentStatus;
}

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/payments`;

  create(payload: CreatePaymentPayload): Observable<PaymentRecord> {
    return this.http.post<ApiResponse<PaymentRecord>>(this.base, payload).pipe(map((res) => this.unwrap(res)));
  }

  listForBooking(bookingId: string): Observable<PaymentRecord[]> {
    const params = new HttpParams().set('bookingId', bookingId);
    return this.http.get<ApiResponse<PaymentRecord[]>>(this.base, { params }).pipe(map((res) => this.unwrap(res)));
  }

  getById(id: string): Observable<PaymentRecord> {
    return this.http
      .get<ApiResponse<PaymentRecord>>(`${this.base}/${encodeURIComponent(id)}`)
      .pipe(map((res) => this.unwrap(res)));
  }

  update(id: string, payload: { status?: PaymentStatus; referenceNote?: string }): Observable<PaymentRecord> {
    return this.http
      .patch<ApiResponse<PaymentRecord>>(`${this.base}/${encodeURIComponent(id)}`, payload)
      .pipe(map((res) => this.unwrap(res)));
  }

  private unwrap<T>(res: ApiResponse<T>): T {
    if (!res.success || res.data === undefined) {
      throw new Error(res.message || 'Request failed');
    }
    return res.data;
  }
}
