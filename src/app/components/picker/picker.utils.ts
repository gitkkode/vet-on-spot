import { CalendarDay, PickerOption } from './picker.types';

export function toPickerOptions(items: readonly string[], emptyLabel?: string): PickerOption[] {
  const options: PickerOption[] = emptyLabel ? [{ value: '', label: emptyLabel }] : [];
  return options.concat(items.map((item) => ({ value: item, label: item })));
}

export function buildTimeOptions(stepMinutes = 30, emptyLabel = 'Select time'): PickerOption[] {
  const options: PickerOption[] = [{ value: '', label: emptyLabel }];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      const value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      options.push({ value, label: value });
    }
  }
  return options;
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function formatDisplayDate(iso: string | null | undefined, placeholder = 'Select date'): string {
  const date = parseIsoDate(iso);
  if (!date) return placeholder;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function buildCalendarMonth(viewYear: number, viewMonth: number, selectedIso?: string): CalendarDay[] {
  const first = new Date(viewYear, viewMonth, 1);
  const startOffset = first.getDay();
  const gridStart = new Date(viewYear, viewMonth, 1 - startOffset);
  const todayIso = toIsoDate(new Date());
  const days: CalendarDay[] = [];

  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const iso = toIsoDate(date);
    days.push({
      date,
      iso,
      day: date.getDate(),
      inMonth: date.getMonth() === viewMonth,
      isToday: iso === todayIso,
      isSelected: !!selectedIso && iso === selectedIso,
      isPast: iso < todayIso,
    });
  }

  return days;
}
