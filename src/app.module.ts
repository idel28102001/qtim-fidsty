import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { BotsModule } from './bots/bots.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { PostsModule } from './posts/posts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MediaModule } from './media/media.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ChannelsModule } from './channels/channels.module';
import { TelegramModule } from './telegram/telegram.module';
import { UsersCenterModule } from './users-center/users-center.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    MailModule,
    BotsModule,
    SubscribersModule,
    PostsModule,
    MediaModule,
    ChannelsModule,
    TelegramModule,
    UsersCenterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule {}
