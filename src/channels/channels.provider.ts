import { Provider } from '@nestjs/common';
import { DATABASE_SOURCE_TOKEN } from '../database/databse.constant';
import { DataSource } from 'typeorm';
import { ChannelsTokensEnum } from './enums/tokens/channels.tokens.enum';
import { ChannelsPostsTokensEnum } from './enums/tokens/channels-posts.tokens.enum';
import { ChannelPostEntity } from './entities/channel-post.entity';
import { ChannelsEntity } from './entities/channels.entity';
import { ChannelsService } from './services/channels.service';
import { ChannelsPostsService } from './services/channels-posts.service';

export const ChannelsProvider: Provider[] = [
  {
    provide: ChannelsTokensEnum.CHANNELS_SERVICE_TOKEN,
    useClass: ChannelsService,
  },
  {
    provide: ChannelsPostsTokensEnum.CHANNELS_POSTS_SERVICE_TOKEN,
    useClass: ChannelsPostsService,
  },

  {
    provide: ChannelsTokensEnum.CHANNELS_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(ChannelsEntity),
  },
  {
    provide: ChannelsPostsTokensEnum.CHANNELS_POSTS_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(ChannelPostEntity),
  },
];
