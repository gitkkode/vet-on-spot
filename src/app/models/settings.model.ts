export interface SettingsProfile {
  fullName: string;
  email: string;
}

export interface SettingsNotifications {
  notifyNewBooking: boolean;
  notifyDispatchTimeout: boolean;
  notifyLowFuel: boolean;
}

export interface SettingsDispatch {
  dispatchRadiusKm: number;
  requestTimeoutMinutes: number;
  maxDoctorsPerRequest: number;
}

export interface SettingsTransport {
  lowFuelThresholdPct: number;
  maintenanceReminderKm: number;
}

export interface PortalSettings {
  profile: SettingsProfile;
  notifications: SettingsNotifications;
  dispatch: SettingsDispatch;
  transport: SettingsTransport;
  updatedAt: string | null;
}
