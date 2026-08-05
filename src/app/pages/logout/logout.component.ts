import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IconComponent } from '../../components/icon/icon.component';

@Component({
  selector: 'app-logout',
  imports: [RouterLink, IconComponent],
  template: `
    <div class="logout-page">
      <div class="logout-page__card">
        <div class="logout-page__card-icon">
          <app-icon name="wave" size="lg" />
        </div>
        <h1>You have been signed out</h1>
        <p>Thank you for using VetOnSpot Admin Portal.</p>
        <a routerLink="/login" class="btn-primary">Sign in again</a>
      </div>
    </div>
  `,
})
export class LogoutComponent implements OnInit {
  constructor(private readonly auth: AuthService) {}

  async ngOnInit(): Promise<void> {
    await this.auth.logout();
  }
}
