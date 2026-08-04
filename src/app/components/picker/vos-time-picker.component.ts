import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { buildTimeOptions } from './picker.utils';
import { VosSelectComponent } from './vos-select.component';

@Component({
  selector: 'app-vos-time-picker',
  imports: [FormsModule, VosSelectComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VosTimePickerComponent),
      multi: true,
    },
  ],
  template: `
    <app-vos-select
      [options]="timeOptions()"
      [panelTitle]="panelTitle()"
      [placeholder]="placeholder()"
      [ngModel]="value"
      (ngModelChange)="onValueChange($event)"
      [disabled]="disabled"
    />
  `,
})
export class VosTimePickerComponent implements ControlValueAccessor {
  readonly panelTitle = input('Time');
  readonly placeholder = input('Select time');
  readonly stepMinutes = input(30);
  readonly emptyLabel = input('Select time');

  value = '';
  disabled = false;

  timeOptions() {
    return buildTimeOptions(this.stepMinutes(), this.emptyLabel());
  }

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  onValueChange(value: string): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
