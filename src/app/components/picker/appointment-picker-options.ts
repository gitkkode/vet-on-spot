import { Doctor } from '../../data/mock-data';
import { CAT_BREEDS, DOG_BREEDS } from '../../models/appointment-form.model';
import { PickerOption } from './picker.types';
import { buildTimeOptions, toPickerOptions } from './picker.utils';

export const SPECIES_OPTIONS = toPickerOptions(
  ['Dog', 'Cat', 'Bird', 'Rabbit', 'Others'],
  'Select species',
);

export const GENDER_OPTIONS = toPickerOptions(['Male', 'Female', 'Unknown'], 'Select gender');

export const YES_NO_OPTIONS = toPickerOptions(['Yes', 'No'], 'Select');

export const SEVERITY_OPTIONS = toPickerOptions(['Mild', 'Moderate', 'Severe'], 'Select severity');

export const APPETITE_OPTIONS = toPickerOptions(['Normal', 'Reduced', 'Not Eating'], 'Select');

export const FOOD_TYPE_OPTIONS = toPickerOptions(
  ['Homemade', 'Dry Food', 'Wet Food', 'Mixed'],
  'Select',
);

export const TIME_OPTIONS = buildTimeOptions();

export const DOCTOR_STATUS_OPTIONS: PickerOption[] = [
  { value: 'available', label: 'Available' },
  { value: 'on-visit', label: 'On Visit' },
  { value: 'offline', label: 'Not Available' },
];

export const DOCTOR_AVAILABILITY_OPTIONS: PickerOption[] = [
  { value: 'available', label: 'I am Available Now' },
  { value: 'on-visit', label: 'On Visit' },
  { value: 'offline', label: 'Not Available' },
];

export function breedOptions(
  species: string,
  dogLabel = 'Select dog breed',
  catLabel = 'Select cat breed',
  optionalLabel = 'Optional',
): PickerOption[] {
  if (species === 'Dog') return toPickerOptions([...DOG_BREEDS], dogLabel);
  if (species === 'Cat') return toPickerOptions([...CAT_BREEDS], catLabel);
  if (species) return [{ value: '', label: optionalLabel }];
  return [];
}

export function doctorPickerOptions(
  doctors: readonly Doctor[],
  emptyLabel = 'Optional',
): PickerOption[] {
  return [
    { value: '', label: emptyLabel },
    ...doctors.map((d) => ({ value: d.name, label: `${d.name} — ${d.specialty}` })),
  ];
}
