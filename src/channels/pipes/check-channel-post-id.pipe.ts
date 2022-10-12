import {
  Inject,
  Injectable,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { ChannelsPostsService } from '../services/channels-posts.service';
import { REQUEST } from '@nestjs/core';
import { ChannelPostDto } from '../dto/channel-post.dto';
import { ChannelsPostsTokensEnum } from '../enums/tokens/channels-posts.tokens.enum';

@Injectable()
export class CheckChannelPostIdPipe extends ValidationPipe {
  constructor(
    @Inject(REQUEST) private request,
    @Inject(ChannelsPostsTokensEnum.CHANNELS_POSTS_SERVICE_TOKEN)
    private readonly channelPostsService: ChannelsPostsService,
  ) {
    super();
  }

  async transform(data: ChannelPostDto) {
    try {
      await this.channelPostsService.repo
        .createQueryBuilder('posts')
        .innerJoin('posts.channel', 'channel', 'channel.id=:channelId', {
          channelId: data.channelId,
        })
        .innerJoin('channel.user', 'user', 'user.id=:userId', {
          userId: this.request.user.userId,
        })
        .where('posts.id=:postId', { postId: data.postId })
        .getOneOrFail();
      data.channelId = Number(data.channelId);
      data.postId = Number(data.postId);
      return data;
    } catch (e) {
      throw new NotFoundException('Такого поста на канале у пользователя нет');
    }
  }
}
