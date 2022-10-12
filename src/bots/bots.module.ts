import { forwardRef, Module } from '@nestjs/common';
import { BotsController } from './controllers/bots.controller';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { MediaModule } from '../media/media.module';
import { TelegramModule } from '../telegram/telegram.module';
import { UsersCenterModule } from '../users-center/users-center.module';
import { PostsModule } from '../posts/posts.module';
import { DatabaseModule } from '../database/database.module';
import { BotsProvider } from './bots.provider';
import { BotsTokenEnum } from './enums/tokens/bots.token.enum';

@Module({
  imports: [
    DatabaseModule,
    MediaModule,
    SubscribersModule,
    forwardRef(() => PostsModule),
    UsersCenterModule,
    TelegramModule,
  ],
  providers: BotsProvider,
  controllers: [BotsController],
  exports: [BotsTokenEnum.BOTS_SERVICE_TOKEN],
})
export class BotsModule {}
