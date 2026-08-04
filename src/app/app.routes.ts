import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'logout',
    loadComponent: () => import('./pages/logout/logout.component').then((m) => m.LogoutComponent),
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./pages/bookings/bookings.component').then((m) => m.BookingsComponent),
      },
      {
        path: 'bookings/:id',
        loadComponent: () =>
          import('./pages/bookings/booking-detail.component').then((m) => m.BookingDetailComponent),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./pages/calendar/calendar.component').then((m) => m.CalendarComponent),
      },
      {
        path: 'doctors',
        loadComponent: () => import('./pages/doctors/doctors.component').then((m) => m.DoctorsComponent),
      },
      {
        path: 'doctors/:id',
        loadComponent: () =>
          import('./pages/doctors/doctor-profile.component').then((m) => m.DoctorProfileComponent),
      },
      {
        path: 'dispatch',
        loadComponent: () =>
          import('./pages/dispatch/dispatch.component').then((m) => m.DispatchComponent),
      },
      {
        path: 'transport',
        loadComponent: () =>
          import('./pages/transport/transport.component').then((m) => m.TransportComponent),
      },
      {
        path: 'live-map',
        loadComponent: () =>
          import('./pages/live-map/live-map.component').then((m) => m.LiveMapComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'appointments/express',
        loadComponent: () =>
          import('./pages/add-appointment/express-add-appointment.component').then(
            (m) => m.ExpressAddAppointmentComponent,
          ),
      },
      {
        path: 'appointments/quick',
        loadComponent: () =>
          import('./pages/add-appointment/quick-add-appointment.component').then(
            (m) => m.QuickAddAppointmentComponent,
          ),
      },
      {
        path: 'appointments/new',
        loadComponent: () =>
          import('./pages/add-appointment/add-appointment.component').then((m) => m.AddAppointmentComponent),
      },
      {
        path: 'appointments/edit/:id',
        loadComponent: () =>
          import('./pages/add-appointment/add-appointment.component').then((m) => m.AddAppointmentComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
