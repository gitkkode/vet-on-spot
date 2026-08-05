import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Booking } from '../models/booking.model';
import { Doctor } from '../models/doctor.model';

export type DashboardPeriod = 'today' | 'yesterday' | 'weekly' | 'monthly' | 'quarterly';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: Record<string, unknown>;
}

export interface DashboardSummary {
  period: DashboardPeriod;
  label: string;
  bookingsLabel: string;
  comparison: string;
  total: number;
  changePercent: number;
  home: number;
  online: number;
  clinic: number;
  homePercent: number;
}

export interface DashboardChartBucket {
  label: string;
  total: number;
  home: number;
  online: number;
  clinic: number;
}

export interface DashboardChartResponse {
  period: DashboardPeriod;
  filter: string;
  buckets: DashboardChartBucket[];
}

export interface DashboardDoctorsStatus {
  available: number;
  onVisit: number;
  offline: number;
  active: Doctor[];
  inactive: Doctor[];
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/dashboard`;

  getSummary(period: DashboardPeriod): Observable<DashboardSummary> {
    const params = new HttpParams().set('period', period);
    return this.http
      .get<ApiResponse<DashboardSummary>>(`${this.base}/summary`, { params })
      .pipe(map((res) => this.unwrap(res)));
  }

  getChart(period: DashboardPeriod, filter = 'all'): Observable<DashboardChartResponse> {
    let params = new HttpParams().set('period', period);
    if (filter !== 'all') params = params.set('filter', filter);
    return this.http
      .get<ApiResponse<DashboardChartResponse>>(`${this.base}/chart`, { params })
      .pipe(map((res) => this.unwrap(res)));
  }

  getAssignQueue(limit = 10): Observable<Booking[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http
      .get<ApiResponse<Booking[]>>(`${this.base}/assign-queue`, { params })
      .pipe(map((res) => this.unwrap(res)));
  }

  getTodayAppointments(limit = 8): Observable<Booking[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http
      .get<ApiResponse<Booking[]>>(`${this.base}/today-appointments`, { params })
      .pipe(map((res) => this.unwrap(res)));
  }

  getDoctorsStatus(): Observable<DashboardDoctorsStatus> {
    return this.http
      .get<ApiResponse<DashboardDoctorsStatus>>(`${this.base}/doctors-status`)
      .pipe(map((res) => this.unwrap(res)));
  }

  private unwrap<T>(res: ApiResponse<T>): T {
    if (!res.success || res.data === undefined) {
      throw new Error(res.message || 'Request failed');
    }
    return res.data;
  }
}
