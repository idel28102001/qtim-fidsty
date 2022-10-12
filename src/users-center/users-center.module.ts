import { Module } from '@nestjs/common';
import { UsersCenterProvider } from './users-center.provider';
import { UserCenterTokensEnum } from './enum/users-center-tokens.enum';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: UsersCenterProvider,
  exports: [UserCenterTokensEnum.USER_CENTER_SERVICE_TOKEN],
})
export class UsersCenterModule {}
