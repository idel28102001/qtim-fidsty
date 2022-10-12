import { HttpException, HttpStatus } from '@nestjs/common';

export class StatusCodeException extends HttpException {
  constructor(statusCode: HttpStatus, successMessage?: string) {
    super(successMessage, statusCode);
  }
}
