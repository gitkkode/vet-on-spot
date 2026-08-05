import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Booking } from '../models/booking.model';
import {
  bookingToForm,
  createEmptyAppointmentForm,
  PetAppointmentForm,
  validateAppointmentForm,
} from '../models/appointment-form.model';
import { BookingApiService } from './booking-api.service';
import { FileApiService } from './file-api.service';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly router = inject(Router);
  private readonly bookingApi = inject(BookingApiService);
  private readonly fileApi = inject(FileApiService);

  readonly pendingUploads = signal<{ category: string; files: File[] }[]>([]);

  readonly openSession = signal(0);
  readonly editingBookingId = signal<string | null>(null);
  readonly form = signal<PetAppointmentForm>(createEmptyAppointmentForm());
  readonly validationErrors = signal<string[]>([]);
  readonly bookingsVersion = signal(0);
  readonly saving = signal(false);

  readonly isEditing = () => this.editingBookingId() !== null;

  openModal(): void {
    this.startQuickCreate('bookings');
  }

  startExpressCreate(): void {
    this.editingBookingId.set(null);
    this.form.set(createEmptyAppointmentForm());
    this.validationErrors.set([]);
    this.openSession.update((v) => v + 1);
    void this.router.navigate(['/appointments/express']);
  }

  startQuickCreate(from: 'dashboard' | 'bookings' = 'dashboard'): void {
    this.editingBookingId.set(null);
    this.form.set(createEmptyAppointmentForm());
    this.validationErrors.set([]);
    this.openSession.update((v) => v + 1);
    void this.router.navigate(['/appointments/quick'], {
      queryParams: from === 'bookings' ? { from: 'bookings' } : {},
    });
  }

  startCreate(from: 'dashboard' | 'bookings' = 'dashboard'): void {
    this.startQuickCreate(from);
  }

  startEdit(booking: Booking, from: 'dashboard' | 'bookings' = 'dashboard'): void {
    this.editingBookingId.set(booking.id);
    this.form.set(bookingToForm(booking));
    this.validationErrors.set([]);
    this.openSession.update((v) => v + 1);
    void this.router.navigate(['/appointments/edit', booking.id], {
      queryParams: from === 'bookings' ? { from: 'bookings' } : {},
    });
  }

  openEditModal(booking: Booking, from: 'dashboard' | 'bookings' = 'dashboard'): void {
    this.startEdit(booking, from);
  }

  async loadBookingForEdit(id: string): Promise<boolean> {
    try {
      const booking = await firstValueFrom(this.bookingApi.getById(id));
      this.editingBookingId.set(booking.id);
      this.form.set(bookingToForm(booking));
      this.validationErrors.set([]);
      return true;
    } catch {
      this.validationErrors.set(['Could not load booking for edit']);
      return false;
    }
  }

  cancel(from: 'dashboard' | 'bookings' = 'dashboard'): void {
    this.editingBookingId.set(null);
    this.validationErrors.set([]);
    void this.router.navigate([from === 'bookings' ? '/bookings' : '/dashboard']);
  }

  resetForm(): void {
    this.form.set(createEmptyAppointmentForm());
    this.validationErrors.set([]);
  }

  async uploadFormFiles(category: string, files: File[]): Promise<string[]> {
    if (!files.length) return [];

    const bookingId = this.editingBookingId();
    if (bookingId) {
      const uploaded = await firstValueFrom(this.fileApi.uploadFiles(bookingId, category, files));
      const booking = await firstValueFrom(this.bookingApi.getById(bookingId));
      this.form.set(bookingToForm(booking));
      return uploaded.map((file) => file.url);
    }

    this.pendingUploads.update((queue) => [...queue, { category, files: [...files] }]);
    return files.map((file) => file.name);
  }

  async flushPendingUploads(): Promise<void> {
    const bookingId = this.editingBookingId();
    const pending = this.pendingUploads();
    if (!bookingId || !pending.length) return;

    for (const item of pending) {
      await firstValueFrom(this.fileApi.uploadFiles(bookingId, item.category, item.files));
    }
    this.pendingUploads.set([]);

    const booking = await firstValueFrom(this.bookingApi.getById(bookingId));
    this.form.set(bookingToForm(booking));
  }

  async saveBooking(validate = false): Promise<Booking | null> {
    const form = this.form();
    const editingId = this.editingBookingId();
    this.saving.set(true);

    try {
      const booking = editingId
        ? await firstValueFrom(this.bookingApi.update(editingId, form, { validate }))
        : await firstValueFrom(this.bookingApi.create(form, validate));

      this.editingBookingId.set(booking.id);
      await this.flushPendingUploads();
      this.validationErrors.set([]);
      this.bookingsVersion.update((v) => v + 1);
      return booking;
    } catch (error) {
      const err = error as Error & { errors?: string[] };
      this.validationErrors.set(err.errors?.length ? err.errors : [err.message || 'Failed to save booking']);
      return null;
    } finally {
      this.saving.set(false);
    }
  }

  async finalizeBooking(): Promise<boolean> {
    const form = this.form();
    const errors = validateAppointmentForm(form);
    if (errors.length) {
      this.validationErrors.set(errors);
      return false;
    }

    const editingId = this.editingBookingId();
    this.saving.set(true);

    try {
      if (editingId) {
        await firstValueFrom(this.bookingApi.update(editingId, form, { validate: true }));
        await this.flushPendingUploads();
      } else {
        const created = await firstValueFrom(this.bookingApi.create(form, true));
        this.editingBookingId.set(created.id);
        await this.flushPendingUploads();
      }

      this.editingBookingId.set(null);
      this.validationErrors.set([]);
      this.bookingsVersion.update((v) => v + 1);
      void this.router.navigate(['/dashboard']);
      return true;
    } catch (error) {
      const err = error as Error & { errors?: string[] };
      this.validationErrors.set(err.errors?.length ? err.errors : [err.message || 'Failed to submit booking']);
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  async getBookings(): Promise<Booking[]> {
    this.bookingsVersion();
    return firstValueFrom(this.bookingApi.list({ limit: 100 }));
  }
}
