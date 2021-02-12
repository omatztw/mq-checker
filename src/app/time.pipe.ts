import { Pipe, PipeTransform } from '@angular/core';
import { toMinutes } from './util/util';

@Pipe({
  name: 'time'
})
export class TimePipe implements PipeTransform {

  transform(value: number, ...args: unknown[]): unknown {
    return toMinutes(value);
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${('00' + minutes).slice(-2)}:${('00' + seconds).slice(-2)}`;
  }

}
