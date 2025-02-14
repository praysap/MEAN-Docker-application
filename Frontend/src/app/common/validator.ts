import { AbstractControl } from '@angular/forms';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';

export function minLengthAsyncValidator(minLength: number) {
  return (control: AbstractControl) => {
    return timer(500).pipe(
      map(() => {
        if (control.value && control.value.length >= minLength) {
          return null; // Validation passes
        } else {
          return { minLength: true }; // Validation fails
        }
      })
    );
  };
}
