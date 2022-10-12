import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { add, compareAsc } from 'date-fns';

@Injectable()
export class ScheduleChannelPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async transform(data) {
    if (data.datePublic && data.timePublic) {
      const date = new Date(`${data.datePublic} ${data.timePublic}`);
      if (compareAsc(add(date, { seconds: 65 }), new Date()) < 0) {
        throw new BadRequestException(
          'Дата уставлена много раньше текущего времени',
        );
      }
    }
    return data;
  }
}
