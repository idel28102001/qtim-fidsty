import { BadRequestException, PipeTransform } from '@nestjs/common';

export class EditPostChannelPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async transform(data) {
    if (!Object.keys(data).length) {
      throw new BadRequestException('Нет ничего, что можно изменить');
    }
    return data;
  }
}
