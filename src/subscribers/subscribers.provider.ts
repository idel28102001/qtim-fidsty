import { Provider } from '@nestjs/common';
import { DATABASE_SOURCE_TOKEN } from '../database/databse.constant';
import { DataSource } from 'typeorm';
import { SubscribersTokensEnum } from './enums/subscribers-tokens.enum';
import { SubscribersService } from './services/subscribers.service';
import { NewsubService } from './services/newsub.service';
import { NewsubEntity } from './entities/newsub.entity';
import { SubscriberEntity } from './entities/subscriber.entity';
import { NewsubsTokensEnum } from './enums/newsubs-tokens.enum';

export const SubscribersProvider: Provider[] = [
  {
    provide: SubscribersTokensEnum.SUBSCRIBERS_SERVICE_TOKEN,
    useClass: SubscribersService,
  },
  {
    provide: NewsubsTokensEnum.NEWSUBS_SERVICE_TOKEN,
    useClass: NewsubService,
  },
  {
    provide: NewsubsTokensEnum.NEWSUBS_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(NewsubEntity),
  },
  {
    provide: SubscribersTokensEnum.SUBSCRIBERS_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SubscriberEntity),
  },
];
