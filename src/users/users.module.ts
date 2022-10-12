import { Global, Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { MediaModule } from '../media/media.module';
import { BotsModule } from '../bots/bots.module';
import { UsersCenterModule } from '../users-center/users-center.module';
import { AuthModule } from '../auth/auth.module';
import { UsersCenterProvider } from './users.provider';

@Global()
@Module({
  imports: [MediaModule, BotsModule, UsersCenterModule, AuthModule],
  controllers: [UsersController],
  providers: UsersCenterProvider,
})
export class UsersModule {}
