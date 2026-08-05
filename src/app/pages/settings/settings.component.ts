import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SettingsApiService } from '../../services/settings-api.service';
import {
  PortalSettings,
  SettingsDispatch,
  SettingsNotifications,
  SettingsProfile,
  SettingsTransport,
} from '../../models/settings.model';

type SettingsTab = 'profile' | 'notifications' | 'dispatch' | 'transport' | 'account';

const EMPTY_SETTINGS: PortalSettings = {
  profile: { fullName: '', email: '' },
  notifications: {
    notifyNewBooking: true,
    notifyDispatchTimeout: true,
    notifyLowFuel: true,
  },
  dispatch: {
    dispatchRadiusKm: 5,
    requestTimeoutMinutes: 10,
    maxDoctorsPerRequest: 3,
  },
  transport: {
    lowFuelThresholdPct: 20,
    maintenanceReminderKm: 5000,
  },
  updatedAt: null,
};

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <h1>Settings</h1>
        <p>Configure portal preferences and dispatch rules</p>
      </div>

      @if (loading()) {
        <div class="card"><p>Loading settings…</p></div>
      } @else {
        <div class="settings-layout">
          <nav class="settings-nav">
            @for (t of tabs; track t.key) {
              <button
                type="button"
                [class.active]="activeTab() === t.key"
                (click)="activeTab.set(t.key)"
              >
                {{ t.label }}
              </button>
            }
          </nav>

          <section class="settings-section">
            @if (saveMessage()) {
              <div class="settings-message">{{ saveMessage() }}</div>
            }
            @if (saveError()) {
              <div class="error-msg">{{ saveError() }}</div>
            }

            @switch (activeTab()) {
              @case ('profile') {
                <h3>Profile</h3>
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" [(ngModel)]="profile.fullName" />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" [ngModel]="profile.email" readonly />
                </div>
                <button type="button" class="btn-primary" [disabled]="saving()" (click)="saveProfile()">
                  Save Profile
                </button>
              }
              @case ('notifications') {
                <h3>Notifications</h3>
                <div class="toggle-row">
                  <span>New booking alerts</span>
                  <input type="checkbox" [(ngModel)]="notifications.notifyNewBooking" />
                </div>
                <div class="toggle-row">
                  <span>Dispatch timeout warnings</span>
                  <input type="checkbox" [(ngModel)]="notifications.notifyDispatchTimeout" />
                </div>
                <div class="toggle-row">
                  <span>Low fuel alerts</span>
                  <input type="checkbox" [(ngModel)]="notifications.notifyLowFuel" />
                </div>
                <button type="button" class="btn-primary" style="margin-top: 16px" [disabled]="saving()" (click)="saveNotifications()">
                  Save Notifications
                </button>
              }
              @case ('dispatch') {
                <h3>Dispatch Rules</h3>
                <div class="form-group">
                  <label>Default search radius (km)</label>
                  <input type="number" min="1" step="1" [(ngModel)]="dispatch.dispatchRadiusKm" />
                </div>
                <div class="form-group">
                  <label>Request timeout (minutes)</label>
                  <input type="number" min="1" step="1" [(ngModel)]="dispatch.requestTimeoutMinutes" />
                </div>
                <div class="form-group">
                  <label>Max doctors per request</label>
                  <input type="number" min="1" max="10" step="1" [(ngModel)]="dispatch.maxDoctorsPerRequest" />
                </div>
                <button type="button" class="btn-primary" [disabled]="saving()" (click)="saveDispatch()">
                  Save Dispatch Rules
                </button>
              }
              @case ('transport') {
                <h3>Transport Settings</h3>
                <div class="form-group">
                  <label>Low fuel alert threshold (%)</label>
                  <input type="number" min="0" max="100" step="1" [(ngModel)]="transport.lowFuelThresholdPct" />
                </div>
                <div class="form-group">
                  <label>Maintenance reminder (km)</label>
                  <input type="number" min="1" step="100" [(ngModel)]="transport.maintenanceReminderKm" />
                </div>
                <button type="button" class="btn-primary" [disabled]="saving()" (click)="saveTransport()">
                  Save Transport Settings
                </button>
              }
              @case ('account') {
                <h3>Account</h3>
                <div class="form-group">
                  <label>Current Password</label>
                  <input type="password" [(ngModel)]="currentPassword" autocomplete="current-password" />
                </div>
                <div class="form-group">
                  <label>New Password</label>
                  <input type="password" [(ngModel)]="newPassword" autocomplete="new-password" />
                </div>
                <button type="button" class="btn-primary" [disabled]="saving()" (click)="changePassword()">
                  Change Password
                </button>
              }
            }
          </section>
        </div>
      }
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private readonly settingsApi = inject(SettingsApiService);
  private readonly authService = inject(AuthService);

  readonly tabs: { key: SettingsTab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'dispatch', label: 'Dispatch Rules' },
    { key: 'transport', label: 'Transport' },
    { key: 'account', label: 'Account' },
  ];

  readonly activeTab = signal<SettingsTab>('profile');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saveMessage = signal('');
  readonly saveError = signal('');

  profile: SettingsProfile = { ...EMPTY_SETTINGS.profile };
  notifications: SettingsNotifications = { ...EMPTY_SETTINGS.notifications };
  dispatch: SettingsDispatch = { ...EMPTY_SETTINGS.dispatch };
  transport: SettingsTransport = { ...EMPTY_SETTINGS.transport };

  currentPassword = '';
  newPassword = '';

  ngOnInit(): void {
    void this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    this.loading.set(true);
    this.saveError.set('');
    try {
      const settings = await firstValueFrom(this.settingsApi.getAll());
      this.applySettings(settings);
    } catch (error) {
      const err = error as Error;
      this.saveError.set(err.message || 'Could not load settings.');
    } finally {
      this.loading.set(false);
    }
  }

  private applySettings(settings: PortalSettings): void {
    this.profile = { ...settings.profile };
    this.notifications = { ...settings.notifications };
    this.dispatch = { ...settings.dispatch };
    this.transport = { ...settings.transport };
  }

  private beginSave(): void {
    this.saving.set(true);
    this.saveMessage.set('');
    this.saveError.set('');
  }

  private endSave(message: string): void {
    this.saveMessage.set(message);
    this.saving.set(false);
  }

  private failSave(error: unknown): void {
    const err = error as Error;
    this.saveError.set(err.message || 'Save failed.');
    this.saving.set(false);
  }

  async saveProfile(): Promise<void> {
    this.beginSave();
    try {
      this.profile = await firstValueFrom(this.settingsApi.updateProfile(this.profile));
      await this.authService.loadProfile();
      this.endSave('Profile saved.');
    } catch (error) {
      this.failSave(error);
    }
  }

  async saveNotifications(): Promise<void> {
    this.beginSave();
    try {
      this.notifications = await firstValueFrom(this.settingsApi.updateNotifications(this.notifications));
      this.endSave('Notification settings saved.');
    } catch (error) {
      this.failSave(error);
    }
  }

  async saveDispatch(): Promise<void> {
    this.beginSave();
    try {
      this.dispatch = await firstValueFrom(this.settingsApi.updateDispatch(this.dispatch));
      this.endSave('Dispatch rules saved.');
    } catch (error) {
      this.failSave(error);
    }
  }

  async saveTransport(): Promise<void> {
    this.beginSave();
    try {
      this.transport = await firstValueFrom(this.settingsApi.updateTransport(this.transport));
      this.endSave('Transport settings saved.');
    } catch (error) {
      this.failSave(error);
    }
  }

  async changePassword(): Promise<void> {
    this.beginSave();
    try {
      await this.authService.changePassword(this.currentPassword, this.newPassword);
      this.currentPassword = '';
      this.newPassword = '';
      this.endSave('Password updated.');
    } catch (error) {
      this.failSave(error);
    }
  }
}
