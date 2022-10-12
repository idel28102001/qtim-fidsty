import {
  BadRequestException,
  Inject,
  Injectable,
  ValidationPipe,
} from '@nestjs/common';
import { BotsService } from '../services/bots.service';
import { REQUEST } from '@nestjs/core';
import { UsersCenterService } from '../../users-center/users-center.service';
import { TelegramService } from '../../telegram/services/telegram.service';
import { UserCenterTokensEnum } from '../../users-center/enum/users-center-tokens.enum';
import { TelegramTokensEnum } from '../../telegram/enum/telegram-tokens.enum';
import { BotsTokenEnum } from '../enums/tokens/bots.token.enum';

@Injectable()
export class BotUsernameExistsPipe extends ValidationPipe {
  constructor(
    @Inject(REQUEST) private request,
    @Inject(BotsTokenEnum.BOTS_SERVICE_TOKEN)
    private readonly botsService: BotsService,
    @Inject(UserCenterTokensEnum.USER_CENTER_SERVICE_TOKEN)
    private readonly usersCenterService: UsersCenterService,
    @Inject(TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN)
    private readonly telegramService: TelegramService,
  ) {
    super({
      transform: true,
    });
  }

  async transform(username) {
    if (!username.endsWith('_bot')) {
      throw new BadRequestException(
        'username не является форматом username бота',
      );
    }

    username = username.startsWith('@') ? username.slice(1) : username;
    const bot = await this.botsService.repo
      .createQueryBuilder('bot')
      .innerJoin('bot.owner', 'owner', 'owner.id=:id', {
        id: Number(this.request.user.userId),
      })
      .andWhere(`bot.username=:username`, { username })
      .select('bot.id')
      .getOne();
    if (bot) {
      throw new BadRequestException('Такой бот уже был добавлен');
    }
    const { sessionHash } = await this.usersCenterService.repo
      .createQueryBuilder('user')
      .where('user.id=:id', { id: Number(this.request.user.userId) })
      .select('user.sessionHash')
      .getOne();
    username = username.startsWith('@') ? username : `@${username}`;
    const client = await this.telegramService.getTelegramClient(sessionHash);
    try {
      await client.getEntity(username);
    } catch (e) {
      throw new BadRequestException('Такого бота не существует');
    }
    await client.disconnect();
    return username;
  }
}
