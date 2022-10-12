import { Module } from '@nestjs/common';
import { SubscribersController } from './subscribers.controller';
import { DatabaseModule } from '../database/database.module';
import { SubscribersProvider } from './subscribers.provider';
import { SubscribersTokensEnum } from './enums/subscribers-tokens.enum';
import { NewsubsTokensEnum } from './enums/newsubs-tokens.enum';

@Module({
  imports: [DatabaseModule],
  controllers: [SubscribersController],
  providers: SubscribersProvider,
  exports: [
    SubscribersTokensEnum.SUBSCRIBERS_SERVICE_TOKEN,
    NewsubsTokensEnum.NEWSUBS_SERVICE_TOKEN,
  ],
})
export class SubscribersModule {}
