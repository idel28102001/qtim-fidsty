import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isISO8601 } from 'class-validator';

@Injectable()
export class QueryAtDayPipe implements PipeTransform {
  async transform(query) {
    const { day } = query;
    if (!isISO8601(day)) {
      throw new BadRequestException('day не валидный');
    }
    return { day };
  }
}
