import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseDelayIntPipe implements PipeTransform {
  async transform(data) {
    data.delay = Number(data.delay);
    return data;
  }
}
