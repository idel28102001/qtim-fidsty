import { Module } from '@nestjs/common';
import { TelegramProvider } from './telegram.provider';
import { TelegramTokensEnum } from './enum/telegram-tokens.enum';

@Module({
  providers: TelegramProvider,
  exports: [
    TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN,
    TelegramTokensEnum.TELEGRAM_BOT_SERVICE_TOKEN,
  ],
})
export class TelegramModule {}
