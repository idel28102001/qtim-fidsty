import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { BotsModule } from '../bots/bots.module';
import { TelegramModule } from '../telegram/telegram.module';
import { UsersCenterModule } from '../users-center/users-center.module';
import { DatabaseModule } from '../database/database.module';
import { config } from '../common/config';
import { AuthProvider } from './auth.provider';
import { AuthTokensEnum } from './enums/tokens/auth.tokens.enum';

@Module({
  imports: [
    DatabaseModule,
    MailModule,
    UsersCenterModule,
    BotsModule,
    PassportModule,
    TelegramModule,
    JwtModule.register(config.registerJWT),
  ],
  providers: AuthProvider,
  controllers: [AuthController],
  exports: [AuthTokensEnum.AUTH_SERVICE_TOKEN],
})
export class AuthModule {}
