import {
  Component,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import {
  buildCalendarMonth,
  formatDisplayDate,
  formatMonthYear,
  parseIsoDate,
  toIsoDate,
} from './picker.utils';

@Component({
  selector: 'app-vos-date-picker',
  imports: [IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VosDatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="vos-picker vos-picker--calendar" [class.vos-picker--open]="open()">
      <button
        type="button"
        class="vos-picker__trigger"
        [class.vos-picker__trigger--placeholder]="!value()"
        [disabled]="isDisabled()"
        (click)="toggle($event)"
      >
        <span>{{ displayValue() }}</span>
        <app-icon name="calendar" size="sm" class="vos-picker__chevron" />
      </button>

      @if (open()) {
        <div class="vos-picker__panel">
          <div class="vos-picker__calendar-head">
            <button type="button" class="vos-picker__nav-btn" aria-label="Previous month" (click)="prevMonth($event)">
              <app-icon name="arrow-left" size="sm" />
            </button>
            <span class="vos-picker__calendar-title">{{ monthLabel() }}</span>
            <button type="button" class="vos-picker__nav-btn" aria-label="Next month" (click)="nextMonth($event)">
              <app-icon name="arrow-right" size="sm" />
            </button>
          </div>

          <div class="vos-picker__weekdays">
            @for (day of weekdays; track day) {
              <span>{{ day }}</span>
            }
          </div>

          <div class="vos-picker__days">
            @for (day of calendarDays(); track day.iso) {
              <button
                type="button"
                class="vos-picker__day"
                [class.vos-picker__day--outside]="!day.inMonth"
                [class.vos-picker__day--past]="day.inMonth && day.isPast && !day.isSelected"
                [class.vos-picker__day--selected]="day.isSelected"
                (click)="selectDay(day, $event)"
              >
                {{ day.day }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class VosDatePickerComponent implements ControlValueAccessor {
  readonly placeholder = input('Select date');

  readonly open = signal(false);
  readonly value = signal('');
  readonly viewYear = signal(new Date().getFullYear());
  readonly viewMonth = signal(new Date().getMonth());
  readonly isDisabled = signal(false);

  readonly weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  readonly monthLabel = computed(() => formatMonthYear(this.viewYear(), this.viewMonth()));

  readonly calendarDays = computed(() =>
    buildCalendarMonth(this.viewYear(), this.viewMonth(), this.value() || undefined),
  );

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  displayValue(): string {
    return formatDisplayDate(this.value(), this.placeholder());
  }

  toggle(event: Event): void {
    event.stopPropagation();
    if (this.isDisabled()) return;
    const selected = parseIsoDate(this.value());
    if (selected) {
      this.viewYear.set(selected.getFullYear());
      this.viewMonth.set(selected.getMonth());
    } else {
      const now = new Date();
      this.viewYear.set(now.getFullYear());
      this.viewMonth.set(now.getMonth());
    }
    this.open.update((v) => !v);
    if (!this.open()) this.onTouched();
  }

  prevMonth(event: Event): void {
    event.stopPropagation();
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update((y) => y - 1);
      return;
    }
    this.viewMonth.update((m) => m - 1);
  }

  nextMonth(event: Event): void {
    event.stopPropagation();
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update((y) => y + 1);
      return;
    }
    this.viewMonth.update((m) => m + 1);
  }

  selectDay(day: { iso: string; inMonth: boolean }, event: Event): void {
    event.stopPropagation();
    if (!day.inMonth) return;
    this.value.set(day.iso);
    this.onChange(day.iso);
    this.onTouched();
    this.open.set(false);
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
    const parsed = parseIsoDate(value);
    if (parsed) {
      this.viewYear.set(parsed.getFullYear());
      this.viewMonth.set(parsed.getMonth());
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
