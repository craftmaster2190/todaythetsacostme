import { filter } from 'rxjs/operators';
import { truthy } from './truthy';

export function filterTruthy<T>() {
  return filter<T>(truthy);
}
