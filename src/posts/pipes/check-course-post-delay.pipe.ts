import {
  BadRequestException,
  Inject,
  Injectable,
  ValidationPipe,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { isInt, isNegative } from 'class-validator';
import { CoursePostDelayDto } from '../dto/bots/course-posts/course-post-delay.dto';

@Injectable()
export class CheckCoursePostDelayPipe extends ValidationPipe {
  constructor(@Inject(REQUEST) private request) {
    super({
      transform: true,
    });
  }

  async transform(data: CoursePostDelayDto) {
    const delay = Number(data.delay);
    if (isNaN(delay)) {
      throw new BadRequestException('delay is invalid');
    }
    if (!isInt(delay)) {
      throw new BadRequestException('delay must be integer number');
    }
    if (isNegative(delay)) {
      throw new BadRequestException('delay is negative');
    }
    data.delay = delay;
    return data;
  }
}
