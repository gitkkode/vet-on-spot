import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BOOKINGS, Booking, createBookingFromForm, updateBookingFromForm } from '../data/mock-data';
import {
  bookingToForm,
  createEmptyAppointmentForm,
  PetAppointmentForm,
} from '../models/appointment-form.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly router = inject(Router);

  readonly openSession = signal(0);
  readonly editingBookingId = signal<string | null>(null);
  readonly form = signal<PetAppointmentForm>(createEmptyAppointmentForm());
  readonly validationErrors = signal<string[]>([]);
  readonly bookingsVersion = signal(0);

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
    // Unified entry: both dashboard and bookings open the Nexus appointment wizard.
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

  cancel(from: 'dashboard' | 'bookings' = 'dashboard'): void {
    this.editingBookingId.set(null);
    this.validationErrors.set([]);
    void this.router.navigate([from === 'bookings' ? '/bookings' : '/dashboard']);
  }

  resetForm(): void {
    this.form.set(createEmptyAppointmentForm());
    this.validationErrors.set([]);
  }

  saveBooking(): void {
    const form = this.form();
    const editingId = this.editingBookingId();
    if (editingId) {
      updateBookingFromForm(editingId, form);
    } else {
      const booking = createBookingFromForm(form);
      this.editingBookingId.set(booking.id);
    }
    this.validationErrors.set([]);
    this.bookingsVersion.update((v) => v + 1);
  }

  finalizeBooking(): void {
    const form = this.form();
    const editingId = this.editingBookingId();
    if (editingId) {
      updateBookingFromForm(editingId, form);
    } else {
      createBookingFromForm(form);
    }
    this.editingBookingId.set(null);
    this.validationErrors.set([]);
    this.bookingsVersion.update((v) => v + 1);
    void this.router.navigate(['/dashboard']);
  }

  getBookings() {
    this.bookingsVersion();
    return BOOKINGS;
  }
}
