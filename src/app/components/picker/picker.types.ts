export interface PickerOption {
  value: string;
  label: string;
}

export interface CalendarDay {
  date: Date;
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
}
