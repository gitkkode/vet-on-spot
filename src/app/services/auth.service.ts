import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'vet-onspot-auth';
  readonly isLoggedIn = signal(this.readStorage());

  login(email: string, password: string): boolean {
    if (email && password.length >= 4) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, 'true');
      }
      this.isLoggedIn.set(true);
      return true;
    }
    return false;
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
    this.isLoggedIn.set(false);
  }

  private readStorage(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(this.storageKey) === 'true';
  }
}
