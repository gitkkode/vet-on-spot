import { Component, inject, input } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-header',
  imports: [IconComponent],
  template: `
    <header class="top-header">
      <div class="top-header__search">
        <app-icon name="search" size="sm" />
        <input type="search" placeholder="Search bookings, doctors..." />
      </div>
      <div class="top-header__actions">
        <button type="button" class="btn-primary top-header__add-btn" (click)="openAddAppointment()">
          <app-icon name="plus" size="sm" />
          Add New Appointment
        </button>
        <button type="button" class="top-header__icon-btn" aria-label="Messages">
          <app-icon name="mail" size="md" />
        </button>
        <button type="button" class="top-header__icon-btn" aria-label="Notifications">
          <app-icon name="bell" size="md" />
          <span class="badge-dot"></span>
        </button>
        <div class="top-header__user">
          <div class="top-header__user-avatar">AD</div>
          <div class="top-header__user-info">
            <strong>Admin User</strong>
            <span>{{ subtitle() }}</span>
          </div>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  private readonly appointmentService = inject(AppointmentService);
  readonly subtitle = input('Office Manager');

  openAddAppointment(): void {
    this.appointmentService.startQuickCreate('dashboard');
  }
}
