import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { ChannelsPostsService } from '../services/channels-posts.service';
import { TelegramService } from '../../telegram/services/telegram.service';
import { Api } from 'telegram';
import { TelegramTokensEnum } from '../../telegram/enum/telegram-tokens.enum';
import { ChannelsPostsTokensEnum } from '../enums/tokens/channels-posts.tokens.enum';

@Injectable()
export class IsPostedPostPipe implements PipeTransform {
  constructor(
    @Inject(ChannelsPostsTokensEnum.CHANNELS_POSTS_SERVICE_TOKEN)
    private readonly channelPostsService: ChannelsPostsService,
    @Inject(TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN)
    private readonly telegramService: TelegramService,
  ) {}

  async transform(id) {
    const post = await this.channelPostsService.repo
      .createQueryBuilder('posts')
      .where('posts.id=:id', { id })
      .leftJoin('posts.channel', 'channel')
      .leftJoin('channel.user', 'user')
      .select(['posts.id', 'posts.scheduled', 'posts.messageId'])
      .addSelect(['channel.id', 'channel.channelId', 'user.sessionHash'])
      .getOne();
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.scheduled) {
      const client = await this.telegramService.getTelegramClient(
        post.channel.user.sessionHash,
      );
      const peer = await this.telegramService.getChannelEntity(
        post.channel.channelId,
        client,
      );
      const result = (await client.invoke(
        new Api.messages.GetScheduledMessages({ peer, id: [post.messageId] }),
      )) as any;
      const wasPublished = !result.messages[0]?.peerId;
      if (wasPublished) {
        throw new BadRequestException(
          'Пост уже был опубликован не может подлежать изменению/удалению',
        );
      } else {
        return id;
      }
    } else {
      throw new BadRequestException(
        'Пост уже был опубликован и не может подлежать изменению/удалению',
      );
    }
  }
}
