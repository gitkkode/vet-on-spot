import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  PortalSettings,
  SettingsDispatch,
  SettingsNotifications,
  SettingsProfile,
  SettingsTransport,
} from '../models/settings.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/settings`;

  getAll(): Observable<PortalSettings> {
    return this.http.get<ApiResponse<PortalSettings>>(this.base).pipe(map((res) => this.unwrap(res)));
  }

  updateProfile(payload: SettingsProfile): Observable<SettingsProfile> {
    return this.http
      .patch<ApiResponse<SettingsProfile>>(`${this.base}/profile`, payload)
      .pipe(map((res) => this.unwrap(res)));
  }

  updateNotifications(payload: SettingsNotifications): Observable<SettingsNotifications> {
    return this.http
      .patch<ApiResponse<SettingsNotifications>>(`${this.base}/notifications`, payload)
      .pipe(map((res) => this.unwrap(res)));
  }

  updateDispatch(payload: SettingsDispatch): Observable<SettingsDispatch> {
    return this.http
      .patch<ApiResponse<SettingsDispatch>>(`${this.base}/dispatch`, payload)
      .pipe(map((res) => this.unwrap(res)));
  }

  updateTransport(payload: SettingsTransport): Observable<SettingsTransport> {
    return this.http
      .patch<ApiResponse<SettingsTransport>>(`${this.base}/transport`, payload)
      .pipe(map((res) => this.unwrap(res)));
  }

  private unwrap<T>(res: ApiResponse<T>): T {
    if (!res.success || res.data === undefined) {
      throw new Error(res.message || 'Request failed');
    }
    return res.data;
  }
}
