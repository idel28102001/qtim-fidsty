import { Provider } from '@nestjs/common';
import { DATABASE_SOURCE_TOKEN } from '../database/databse.constant';
import { DataSource } from 'typeorm';
import { UserCenterTokensEnum } from './enum/users-center-tokens.enum';
import { UsersCenterService } from './users-center.service';
import { UserEntity } from './entities/user.entity';

export const UsersCenterProvider: Provider[] = [
  {
    provide: UserCenterTokensEnum.USER_CENTER_SERVICE_TOKEN,
    useClass: UsersCenterService,
  },
  {
    provide: UserCenterTokensEnum.USER_CENTER_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(UserEntity),
  },
];
