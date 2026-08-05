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
            <div class="password-field">
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                class="password-field__toggle"
                (click)="togglePasswordVisibility()"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
              >
                <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" size="sm" />
              </button>
            </div>
          </div>
          <label class="remember-row">
            <input type="checkbox" [(ngModel)]="remember" name="remember" />
            Remember me
          </label>
          <button type="submit" class="btn-primary" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign In' }}
          </button>
          <a href="#" class="forgot-link" (click)="$event.preventDefault()">Forgot password?</a>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  remember = true;
  readonly error = signal('');
  readonly loading = signal(false);
  readonly showPassword = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  async onSubmit(): Promise<void> {
    this.error.set('');
    this.loading.set(true);
    try {
      await this.auth.login(this.email, this.password);
      await this.router.navigate(['/dashboard']);
    } catch {
      this.error.set('Invalid email or password.');
    } finally {
      this.loading.set(false);
    }
  }
}
