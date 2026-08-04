import {
  Component,
  ElementRef,
  HostListener,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { PickerOption } from './picker.types';

@Component({
  selector: 'app-vos-select',
  imports: [IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VosSelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="vos-picker" [class.vos-picker--open]="open()">
      <button
        type="button"
        class="vos-picker__trigger"
        [class.vos-picker__trigger--placeholder]="!value()"
        [disabled]="isDisabled()"
        (click)="toggle($event)"
      >
        <span>{{ displayLabel() }}</span>
        <app-icon
          name="arrow-right"
          size="sm"
          class="vos-picker__chevron"
          [class.vos-picker__chevron--open]="open()"
        />
      </button>

      @if (open()) {
        <div class="vos-picker__panel">
          <div class="vos-picker__panel-head">{{ panelTitle() }}</div>
          <ul class="vos-picker__list">
            @for (opt of options(); track opt.value) {
              <li>
                <button
                  type="button"
                  class="vos-picker__option"
                  [class.vos-picker__option--selected]="value() === opt.value"
                  (click)="selectOption(opt, $event)"
                >
                  <span>{{ opt.label }}</span>
                  @if (value() === opt.value) {
                    <app-icon name="check" size="sm" />
                  }
                </button>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class VosSelectComponent implements ControlValueAccessor {
  readonly options = input.required<PickerOption[]>();
  readonly panelTitle = input('Select');
  readonly placeholder = input('Select');

  readonly open = signal(false);
  readonly value = signal('');
  readonly isDisabled = signal(false);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  displayLabel(): string {
    const current = this.value();
    const match = this.options().find((opt) => opt.value === current);
    if (match) return match.label;
    return this.placeholder();
  }

  toggle(event: Event): void {
    event.stopPropagation();
    if (this.isDisabled()) return;
    this.open.update((v) => !v);
    if (!this.open()) this.onTouched();
  }

  selectOption(opt: PickerOption, event: Event): void {
    event.stopPropagation();
    this.value.set(opt.value);
    this.onChange(opt.value);
    this.onTouched();
    this.open.set(false);
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
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
