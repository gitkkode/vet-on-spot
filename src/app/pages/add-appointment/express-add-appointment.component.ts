import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../components/icon/icon.component';
import { VosDatePickerComponent } from '../../components/picker/vos-date-picker.component';
import { VosSelectComponent } from '../../components/picker/vos-select.component';
import { VosTimePickerComponent } from '../../components/picker/vos-time-picker.component';
import { AppointmentFormBase } from './appointment-form.base';
import { BookingMode } from '../../models/appointment-form.model';

@Component({
  selector: 'app-express-add-appointment',
  imports: [FormsModule, IconComponent, VosSelectComponent, VosDatePickerComponent, VosTimePickerComponent],
  templateUrl: './express-add-appointment.component.html',
})
export class ExpressAddAppointmentComponent extends AppointmentFormBase {
  private readonly location = inject(Location);

  back(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    this.appointmentService.cancel('dashboard');
  }

  close(): void {
    this.appointmentService.cancel('dashboard');
  }

  onModeChange(mode: BookingMode): void {
    this.selectBookingMode(mode);
  }
}
