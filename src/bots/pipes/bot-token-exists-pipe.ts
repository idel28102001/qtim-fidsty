import {
  Inject,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { BotsService } from '../services/bots.service';
import { AddBotDto } from '../dto/add.bot.dto';
import { BotsTokenEnum } from '../enums/tokens/bots.token.enum';

@Injectable()
export class BotTokenExistsPipe implements PipeTransform {
  constructor(
    @Inject(BotsTokenEnum.BOTS_SERVICE_TOKEN)
    private readonly botsService: BotsService,
  ) {}

  async transform(dto: AddBotDto) {
    const bot = await this.botsService.findBotByToken(dto.token, {
      select: ['id'],
    });

    if (bot) {
      throw new NotFoundException('Bot already exists');
    }

    return dto;
  }
}
