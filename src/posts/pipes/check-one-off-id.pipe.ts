import {
  Inject,
  Injectable,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DiffTypePostsService } from '../services/posts/diff-type-posts.service';
import { TypeOfPostsEnum } from '../enums/type-of-posts.enum';
import { DiffTypePostsTokensEnum } from '../enums/tokens/diff-type-posts.tokens.enum';

@Injectable()
export class CheckOneOffIdPipe extends ValidationPipe {
  constructor(
    @Inject(REQUEST) private request,
    @Inject(DiffTypePostsTokensEnum.DIFFTYPEPOSTS_SERVICE_TOKEN)
    private readonly diffTypePostsService: DiffTypePostsService,
  ) {
    super({
      transform: true,
    });
  }

  async transform(id) {
    try {
      await this.diffTypePostsService.repo
        .createQueryBuilder('P')
        .innerJoin('P.bot', 'bot')
        .innerJoin('bot.owner', 'owner')
        .where('owner.id=:userId', { userId: this.request.user.userId })
        .andWhere('P.id=:id', { id: Number(id) })
        .andWhere('P.type=:type', { type: TypeOfPostsEnum.ONETIMEPOSTS })
        .select('P.id')
        .getOneOrFail();
      return id;
    } catch (e) {
      throw new NotFoundException('One-off post not found');
    }
  }
}
