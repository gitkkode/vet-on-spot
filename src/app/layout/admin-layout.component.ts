import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { HeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="admin-shell" [class.admin-shell--no-sidebar]="hideSidebar()">
      @if (!hideSidebar()) {
        <app-sidebar />
      }
      <div class="admin-main">
        @if (!hideSidebar()) {
          <app-header />
        }
        <main class="admin-content" [class.admin-content--standalone]="hideSidebar()">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly hideSidebar = computed(() => {
    const url = this.currentUrl();
    const path = url.split('?')[0];
    const query = url.includes('?') ? url.split('?')[1] : '';
    const from = new URLSearchParams(query).get('from');

    // Bookings list keeps sidebar; booking detail & booking form do not.
    if (path.startsWith('/appointments/express')) return true;
    if (path.startsWith('/appointments/quick')) return true;
    if (/^\/bookings\/[^/]+/.test(path)) return true;
    if (/^\/doctors\/[^/]+/.test(path)) return true;
    if (path.startsWith('/appointments/') && from === 'bookings') return true;

    return false;
  });
}
