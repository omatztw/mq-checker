import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phase',
})
export class PhasePipe implements PipeTransform {
  transform(value: number, ...args: unknown[]): unknown {
    const phase = Math.floor(value / 5);
    const step = value % 5;
    return `${phase} - ${step}`;
  }
}
