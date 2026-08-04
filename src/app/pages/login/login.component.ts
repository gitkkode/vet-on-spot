import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { IconComponent } from '../../components/icon/icon.component';

@Component({
  selector: 'app-login',
  imports: [FormsModule, IconComponent],
  template: `
    <div class="login-page">
      <div class="login-page__card">
        <div class="login-page__logo">
          <div class="login-page__logo-icon">
            <app-icon name="paw" size="lg" />
          </div>
          <h1>VetOnSpot</h1>
          <p>Admin Portal</p>
        </div>
        <form class="login-page__form" (ngSubmit)="onSubmit()">
          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" placeholder="admin@vetonspot.com" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required />
          </div>
          <label class="remember-row">
            <input type="checkbox" [(ngModel)]="remember" name="remember" />
            Remember me
          </label>
          <button type="submit" class="btn-primary">Sign In</button>
          <a href="#" class="forgot-link" (click)="$event.preventDefault()">Forgot password?</a>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = 'admin@vetonspot.com';
  password = 'admin123';
  remember = true;
  readonly error = signal('');

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  onSubmit(): void {
    if (this.auth.login(this.email, this.password)) {
      this.router.navigate(['/dashboard']);
    } else {
      this.error.set('Invalid email or password. Use any email and password (4+ chars).');
    }
  }
}
