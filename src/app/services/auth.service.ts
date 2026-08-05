import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

import { environment } from '../../environments/environment';
import { firebaseAuth } from '../core/firebase';

export interface AdminProfile {
  uid: string;
  email?: string;
  fullName?: string;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isLoggedIn = signal(false);
  readonly authReady = signal(false);
  readonly profile = signal<AdminProfile | null>(null);

  private readonly idTokenSignal = signal<string | null>(null);
  private readonly readyPromise: Promise<void>;

  constructor(private readonly http: HttpClient) {
    let resolveReady!: () => void;
    this.readyPromise = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });

    onAuthStateChanged(firebaseAuth, async (user) => {
      this.isLoggedIn.set(!!user);

      if (user) {
        this.idTokenSignal.set(await user.getIdToken());
      } else {
        this.idTokenSignal.set(null);
        this.profile.set(null);
      }

      if (!this.authReady()) {
        this.authReady.set(true);
        resolveReady();
      }

      if (user) {
        try {
          await this.fetchProfile();
        } catch {
          this.profile.set({
            uid: user.uid,
            email: user.email || undefined,
          });
        }
      }
    });
  }

  idToken(): string | null {
    return this.idTokenSignal();
  }

  waitUntilReady(): Promise<void> {
    return this.readyPromise;
  }

  async loadProfile(): Promise<AdminProfile> {
    await this.waitUntilReady();
    if (!this.isLoggedIn()) {
      throw new Error('Not logged in');
    }
    return this.fetchProfile();
  }

  private async fetchProfile(): Promise<AdminProfile> {
    const response = await firstValueFrom(
      this.http.get<{ success: boolean; data: AdminProfile }>(`${environment.apiUrl}/auth/me`),
    );
    this.profile.set(response.data);
    return response.data;
  }

  profileInitials(): string {
    const profile = this.profile();
    const name = profile?.fullName?.trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }

    const email = profile?.email || '';
    return email.slice(0, 2).toUpperCase() || 'AD';
  }

  displayName(): string {
    return this.profile()?.fullName || this.profile()?.email || 'Admin User';
  }

  async login(email: string, password: string): Promise<void> {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    this.idTokenSignal.set(await credential.user.getIdToken());
    this.isLoggedIn.set(true);
    await this.loadProfile();
  }

  async logout(): Promise<void> {
    await signOut(firebaseAuth);
    this.idTokenSignal.set(null);
    this.profile.set(null);
    this.isLoggedIn.set(false);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = firebaseAuth.currentUser;
    if (!user?.email) {
      throw new Error('Not logged in');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters');
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    this.idTokenSignal.set(await user.getIdToken(true));
  }
}
