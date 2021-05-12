import {ValidatorFn} from "@angular/forms";

export const CustomValidators = {
  typeofValue(expected: 'number' | 'string' | 'object'): ValidatorFn {
    return (control) => {
      let actual = typeof control?.value;
      if (actual !== expected) {
        return {
          typeofValue: {
            expected, actual
          }
        }
      }
      return null;
    }
  }
}
