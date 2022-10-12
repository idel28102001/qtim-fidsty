import {
  Inject,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { BotsService } from '../services/bots.service';
import { BotsTokenEnum } from '../enums/tokens/bots.token.enum';

@Injectable()
export class StatusIdPipe implements PipeTransform {
  constructor(
    @Inject(BotsTokenEnum.BOTS_SERVICE_TOKEN)
    private readonly botsService: BotsService,
  ) {}

  async transform(id) {
    const bot = await this.botsService.findBotByIdWithOpts(id, {
      select: ['status'],
    });

    if (!bot) {
      throw new NotFoundException('Bot not found');
    }

    await this.botsService.checkBotStatus(bot.status);

    return id;
  }
}
