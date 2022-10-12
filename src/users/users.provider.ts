import { Provider } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersTokensEnum } from './enums/users-tokens.enum';

export const UsersCenterProvider: Provider[] = [
  {
    provide: UsersTokensEnum.USERS_SERVICE_TOKEN,
    useClass: UsersService,
  },
];
