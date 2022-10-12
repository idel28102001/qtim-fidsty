import {
  Inject,
  Injectable,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { BotsService } from '../../bots/services/bots.service';
import { CreateOneTimePostDto } from '../dto/bots/one-time-posts/create-one-time-post.dto';
import { REQUEST } from '@nestjs/core';
import { BotsTokenEnum } from '../../bots/enums/tokens/bots.token.enum';

@Injectable()
export class BotIdExistsForPostsPipe extends ValidationPipe {
  constructor(
    @Inject(REQUEST) private request,
    @Inject(BotsTokenEnum.BOTS_SERVICE_TOKEN)
    private readonly botsService: BotsService,
  ) {
    super({
      transform: true,
    });
  }

  async transform(data: CreateOneTimePostDto) {
    try {
      await this.botsService.repo
        .createQueryBuilder('bot')
        .innerJoin('bot.owner', 'owner', 'owner.id=:id', {
          id: this.request.user.userId,
        })
        .where('bot.id=:botId', { botId: Number(data.botId) })
        .select('bot.id')
        .getOneOrFail();
      return data;
    } catch (e) {
      throw new NotFoundException('Такого бота у пользователя нет');
    }
  }
}
