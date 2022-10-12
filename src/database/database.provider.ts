import { Provider } from '@nestjs/common';
import { DATABASE_SOURCE_TOKEN } from './databse.constant';
import AppDataSource from './data-source';
import { ConfigService } from '@nestjs/config';

export const DatabaseProvider: Provider = {
  provide: DATABASE_SOURCE_TOKEN,
  inject: [ConfigService],
  useFactory: async () => AppDataSource.initialize(),
};
