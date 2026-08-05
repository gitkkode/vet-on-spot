import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface BookingFile {
  id: string;
  bookingId: string;
  category: string;
  fileName: string;
  url: string;
  mimeType?: string;
  size?: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class FileApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  uploadFiles(bookingId: string, category: string, files: File[]): Observable<BookingFile[]> {
    const formData = new FormData();
    formData.append('category', category);
    for (const file of files) {
      formData.append('files', file);
    }
    return this.http
      .post<ApiResponse<BookingFile[]>>(`${this.base}/bookings/${encodeURIComponent(bookingId)}/files`, formData)
      .pipe(map((res) => this.unwrap(res)));
  }

  listForBooking(bookingId: string): Observable<BookingFile[]> {
    return this.http
      .get<ApiResponse<BookingFile[]>>(`${this.base}/bookings/${encodeURIComponent(bookingId)}/files`)
      .pipe(map((res) => this.unwrap(res)));
  }

  delete(fileId: string): Observable<{ id: string }> {
    return this.http
      .delete<ApiResponse<{ id: string }>>(`${this.base}/files/${encodeURIComponent(fileId)}`)
      .pipe(map((res) => this.unwrap(res)));
  }

  private unwrap<T>(res: ApiResponse<T>): T {
    if (!res.success || res.data === undefined) {
      throw new Error(res.message || 'Request failed');
    }
    return res.data;
  }
}
