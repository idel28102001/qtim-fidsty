import {
  Inject,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { BotsService } from '../services/bots.service';
import { BotsTokenEnum } from '../enums/tokens/bots.token.enum';

@Injectable()
export class BotIdsExistsPipe implements PipeTransform {
  constructor(
    @Inject(BotsTokenEnum.BOTS_SERVICE_TOKEN)
    private readonly botsService: BotsService,
  ) {}

  async transform(data) {
    const bots = await this.botsService.findBotByIds(data.botIds, {
      select: ['id'],
    });
    if (bots.length !== data.botIds.length) {
      const notFoundBots = data.botIds.filter(
        (e) => !bots.map((e) => e.id).includes(Number(e)),
      );
      throw new NotFoundException(
        `Bots with Ids ${notFoundBots} in bots DB not found`,
      );
    }

    return data;
  }
}
