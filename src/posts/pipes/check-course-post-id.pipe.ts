import {
  Inject,
  Injectable,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DiffTypePostsService } from '../services/posts/diff-type-posts.service';
import { TypeOfPostsEnum } from '../enums/type-of-posts.enum';
import { CoursePostDto } from '../dto/bots/course-posts/course-post.dto';
import { DiffTypePostsTokensEnum } from '../enums/tokens/diff-type-posts.tokens.enum';

@Injectable()
export class CheckCoursePostIdPipe extends ValidationPipe {
  constructor(
    @Inject(REQUEST) private request,
    @Inject(DiffTypePostsTokensEnum.DIFFTYPEPOSTS_SERVICE_TOKEN)
    private readonly diffTypePostsService: DiffTypePostsService,
  ) {
    super({
      transform: true,
    });
  }

  async transform(data: CoursePostDto) {
    try {
      await this.diffTypePostsService.repo
        .createQueryBuilder('P')
        .innerJoin('P.bot', 'bot')
        .innerJoin('bot.owner', 'owner')
        .innerJoin('P.course', 'course', 'course.id=:courseId', {
          courseId: data.courseId,
        })
        .where('owner.id=:userId', { userId: this.request.user.userId })
        .andWhere('P.id=:id', { id: Number(data.postId) })
        .andWhere('P.type=:type', { type: TypeOfPostsEnum.COURSEPOSTS })
        .select('P.id')
        .getOneOrFail();
      data.courseId = Number(data.courseId);
      data.postId = Number(data.postId);
      return data;
    } catch (e) {
      throw new NotFoundException('Post on this course not found');
    }
  }
}
