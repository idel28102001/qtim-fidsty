import { Provider } from '@nestjs/common';
import { DATABASE_SOURCE_TOKEN } from '../database/databse.constant';
import { DataSource } from 'typeorm';
import { BotsTokenEnum } from './enums/tokens/bots.token.enum';
import { BotsService } from './services/bots.service';
import { BotEntity } from './entities/bot.entity';

export const BotsProvider: Provider[] = [
  {
    provide: BotsTokenEnum.BOTS_SERVICE_TOKEN,
    useClass: BotsService,
  },
  {
    provide: BotsTokenEnum.BOTS_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) => dataSource.getRepository(BotEntity),
  },
];
