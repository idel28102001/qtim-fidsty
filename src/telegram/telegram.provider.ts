import { Provider } from '@nestjs/common';
import { TelegramTokensEnum } from './enum/telegram-tokens.enum';
import { TelegramService } from './services/telegram.service';
import { TelegramBotService } from './services/telegram-bot.service';

export const TelegramProvider: Provider[] = [
  {
    provide: TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN,
    useClass: TelegramService,
  },
  {
    provide: TelegramTokensEnum.TELEGRAM_BOT_SERVICE_TOKEN,
    useClass: TelegramBotService,
  },
];
