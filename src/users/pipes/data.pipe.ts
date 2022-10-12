import { ConflictException, ValidationPipe } from '@nestjs/common';

export class DataPipe extends ValidationPipe {
  async transform(data) {
    if (Object.keys(data).length === 0) {
      throw new ConflictException('Please enter the data');
    }

    return data;
  }
}
