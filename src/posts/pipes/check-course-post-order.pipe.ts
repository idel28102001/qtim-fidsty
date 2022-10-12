import {
  BadRequestException,
  Inject,
  Injectable,
  ValidationPipe,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DiffTypePostsService } from '../services/posts/diff-type-posts.service';
import { CoursePostOrderDto } from '../dto/bots/course-posts/course-post-order.dto';
import { isInt, isNegative } from 'class-validator';
import { DiffTypePostsTokensEnum } from '../enums/tokens/diff-type-posts.tokens.enum';

@Injectable()
export class CheckCoursePostOrderPipe extends ValidationPipe {
  constructor(
    @Inject(REQUEST) private request,
    @Inject(DiffTypePostsTokensEnum.DIFFTYPEPOSTS_SERVICE_TOKEN)
    private readonly diffTypePostsService: DiffTypePostsService,
  ) {
    super({
      transform: true,
    });
  }

  async transform(data: CoursePostOrderDto) {
    let order = Number(data.order);
    if (isNaN(order)) {
      throw new BadRequestException('order is invalid');
    }
    if (!isInt(order)) {
      throw new BadRequestException('order must be integer number');
    }
    const postsCount = await this.diffTypePostsService.repo
      .createQueryBuilder('P')
      .innerJoin('P.course', 'course', 'course.id=:courseId', {
        courseId: data.courseId,
      })
      .getCount();
    const post = await this.diffTypePostsService.repo
      .createQueryBuilder('P')
      .where('P.id=:postId', { postId: data.postId })
      .select(['P.id', 'P.order'])
      .getOne();
    if (isNegative(order)) {
      order = order + postsCount;
      if (isNegative(order)) {
        throw new BadRequestException('order превышает число постов');
      }
    } else {
      if (order >= postsCount) {
        throw new BadRequestException('order превышает число постов');
      }
    }
    if (post.order === order) {
      throw new BadRequestException('order не изменился');
    }
    data.order = order;
    return data;
  }
}
