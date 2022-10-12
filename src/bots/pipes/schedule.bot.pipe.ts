import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ScheduleBotPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async transform(data) {
    if (new Date(data.datePublic).getTime() + 5000 < Date.now()) {
      throw new BadRequestException(
        'Дата уставлена много раньше текущего времени',
      );
    }
    return data;
  }
}
