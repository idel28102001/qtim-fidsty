import {
  Inject,
  Injectable,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { BotsService } from '../services/bots.service';
import { REQUEST } from '@nestjs/core';
import { BotsTokenEnum } from '../enums/tokens/bots.token.enum';

@Injectable()
export class BotIdExistsPipe extends ValidationPipe {
  constructor(
    @Inject(REQUEST) private request,
    @Inject(BotsTokenEnum.BOTS_SERVICE_TOKEN)
    private readonly botsService: BotsService,
  ) {
    super({
      transform: true,
    });
  }

  async transform(botId) {
    try {
      await this.botsService.repo
        .createQueryBuilder('bot')
        .innerJoin('bot.owner', 'owner', 'owner.id=:id', {
          id: this.request.user.userId,
        })
        .where('bot.id=:botId', { botId: Number(botId) })
        .getOneOrFail();
      return botId;
    } catch (e) {
      throw new NotFoundException('Такого бота у пользователя нет');
    }
  }
}
