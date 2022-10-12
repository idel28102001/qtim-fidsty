import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isISO8601 } from 'class-validator';

@Injectable()
export class QueryInPeriodPipe implements PipeTransform {
  async transform(query) {
    const { dateFrom, dateTo } = query;
    if (!isISO8601(dateFrom)) {
      throw new BadRequestException('dateFrom не валидный');
    }
    if (!isISO8601(dateTo)) {
      throw new BadRequestException('dateTo не валидный');
    }
    return { dateFrom, dateTo };
  }
}
