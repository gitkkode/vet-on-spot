import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icon.types';

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside class="sidebar">
      <div class="sidebar__logo">
        <div class="sidebar__logo-icon">
          <app-icon name="paw" size="lg" />
        </div>
        <span>VetOnSpot</span>
      </div>
      <nav class="sidebar__nav">
        @for (item of navItems; track item.path) {
          <a
            class="sidebar__link"
            [routerLink]="item.path"
            routerLinkActive="sidebar__link--active"
          >
            <span class="sidebar__link-icon">
              <app-icon [name]="item.icon" size="sm" />
            </span>
            {{ item.label }}
          </a>
        }
      </nav>
      <div class="sidebar__footer">
        <a class="sidebar__logout" routerLink="/logout">
          <app-icon name="log-out" size="sm" />
          Log out
        </a>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'layout-grid' },
    { path: '/bookings', label: 'Bookings', icon: 'clipboard' },
    { path: '/calendar', label: 'Calendar', icon: 'calendar' },
    { path: '/doctors', label: 'Doctors', icon: 'doctor' },
    { path: '/dispatch', label: 'Dispatch', icon: 'radio' },
    { path: '/transport', label: 'Transport', icon: 'truck' },
    { path: '/live-map', label: 'Live Map', icon: 'map' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
  ];
}
