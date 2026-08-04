import { Component, signal } from '@angular/core';

type SettingsTab = 'profile' | 'notifications' | 'dispatch' | 'transport' | 'account';

@Component({
  selector: 'app-settings',
  template: `
    <div class="settings-page">
      <div class="page-header">
        <h1>Settings</h1>
        <p>Configure portal preferences and dispatch rules</p>
      </div>

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
          @switch (activeTab()) {
            @case ('profile') {
              <h3>Profile</h3>
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" value="Admin User" />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" value="admin@vetonspot.com" />
              </div>
              <button type="button" class="btn-primary">Save Profile</button>
            }
            @case ('notifications') {
              <h3>Notifications</h3>
              <div class="toggle-row">
                <span>New booking alerts</span>
                <input type="checkbox" checked />
              </div>
              <div class="toggle-row">
                <span>Dispatch timeout warnings</span>
                <input type="checkbox" checked />
              </div>
              <div class="toggle-row">
                <span>Low fuel alerts</span>
                <input type="checkbox" checked />
              </div>
              <button type="button" class="btn-primary" style="margin-top: 16px">Save Notifications</button>
            }
            @case ('dispatch') {
              <h3>Dispatch Rules</h3>
              <div class="form-group">
                <label>Default search radius (km)</label>
                <input type="number" value="5" />
              </div>
              <div class="form-group">
                <label>Request timeout (minutes)</label>
                <input type="number" value="10" />
              </div>
              <div class="form-group">
                <label>Max doctors per request</label>
                <input type="number" value="3" />
              </div>
              <button type="button" class="btn-primary">Save Dispatch Rules</button>
            }
            @case ('transport') {
              <h3>Transport Settings</h3>
              <div class="form-group">
                <label>Low fuel alert threshold (%)</label>
                <input type="number" value="20" />
              </div>
              <div class="form-group">
                <label>Maintenance reminder (km)</label>
                <input type="number" value="5000" />
              </div>
              <button type="button" class="btn-primary">Save Transport Settings</button>
            }
            @case ('account') {
              <h3>Account</h3>
              <div class="form-group">
                <label>Current Password</label>
                <input type="password" />
              </div>
              <div class="form-group">
                <label>New Password</label>
                <input type="password" />
              </div>
              <button type="button" class="btn-primary">Change Password</button>
            }
          }
        </section>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  readonly tabs: { key: SettingsTab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'dispatch', label: 'Dispatch Rules' },
    { key: 'transport', label: 'Transport' },
    { key: 'account', label: 'Account' },
  ];

  readonly activeTab = signal<SettingsTab>('profile');
}
