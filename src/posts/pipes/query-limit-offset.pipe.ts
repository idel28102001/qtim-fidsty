import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class QueryLimitOffsetPipe implements PipeTransform {
  async transform(query) {
    const { offset = 0, limit = 6 } = query;
    if (isNaN(Number(offset))) {
      throw new BadRequestException('offset параметр не число');
    }

    if (isNaN(Number(limit))) {
      throw new BadRequestException('limit параметр не число');
    }
    return { offset: Number(offset), limit: Number(limit) };
  }
}
