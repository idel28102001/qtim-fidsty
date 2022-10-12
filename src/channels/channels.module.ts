import { Module } from '@nestjs/common';
import { ChannelsController } from './controllers/channels.controller';
import { TelegramModule } from '../telegram/telegram.module';
import { UsersCenterModule } from '../users-center/users-center.module';
import { ChannelsPostsController } from './controllers/channels-posts.controller';
import { PostsModule } from '../posts/posts.module';
import { MediaModule } from '../media/media.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { BotsModule } from '../bots/bots.module';
import { DatabaseModule } from '../database/database.module';
import { ChannelsProvider } from './channels.provider';
import { ChannelsTokensEnum } from './enums/tokens/channels.tokens.enum';
import { ChannelsPostsTokensEnum } from './enums/tokens/channels-posts.tokens.enum';

@Module({
  imports: [
    DatabaseModule,
    TelegramModule,
    UsersCenterModule,
    PostsModule,
    MediaModule,
    SubscribersModule,
    BotsModule,
  ],
  providers: ChannelsProvider,
  controllers: [ChannelsController, ChannelsPostsController],
  exports: [
    ChannelsTokensEnum.CHANNELS_SERVICE_TOKEN,
    ChannelsPostsTokensEnum.CHANNELS_POSTS_SERVICE_TOKEN,
  ],
})
export class ChannelsModule {}
