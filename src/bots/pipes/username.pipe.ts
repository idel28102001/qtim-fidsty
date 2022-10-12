import {
  ConflictException,
  Inject,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { BotsService } from '../services/bots.service';
import { BotsTokenEnum } from '../enums/tokens/bots.token.enum';

@Injectable()
export class UsernamePipe implements PipeTransform {
  constructor(
    @Inject(BotsTokenEnum.BOTS_SERVICE_TOKEN)
    private readonly botsService: BotsService,
  ) {}

  async transform(data) {
    const bot = await this.botsService.findBotByUsername(data.username);

    if (bot) {
      throw new ConflictException('Bot is exist');
    }

    return data;
  }
}
