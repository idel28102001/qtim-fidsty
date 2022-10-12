import {
  Inject,
  Injectable,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { CoursesService } from '../services/posts/courses.service';
import { REQUEST } from '@nestjs/core';
import { CoursesTokensEnum } from '../enums/tokens/courses.tokens.enum';

@Injectable()
export class CheckCoursesIdPipe extends ValidationPipe {
  constructor(
    @Inject(REQUEST) private request,
    @Inject(CoursesTokensEnum.COURSES_SERVICE_TOKEN)
    private readonly coursesService: CoursesService,
  ) {
    super({
      transform: true,
    });
  }

  async transform(id) {
    try {
      await this.coursesService.repo
        .createQueryBuilder('C')
        .innerJoin('C.bot', 'bot')
        .innerJoin('bot.owner', 'owner')
        .where('owner.id=:userId', { userId: this.request.user.userId })
        .andWhere('C.id=:id', { id: Number(id) })
        .select('C.id')
        .getOneOrFail();
      return id;
    } catch (e) {
      throw new NotFoundException('Course not found');
    }
  }
}
