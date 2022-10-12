import { ConflictException, ValidationPipe } from '@nestjs/common';

export class CheckFilePipe extends ValidationPipe {
  async transform(data) {
    if (!data) {
      throw new ConflictException(
        'The field with the file should not be empty',
      );
    }
    return data;
  }
}
