import { Inject, Injectable } from '@nestjs/common';
import { OneoffpostsService } from './posts/oneoffposts.service';
import { TelegramService } from '../../telegram/services/telegram.service';
import { DiffTypePostsService } from './posts/diff-type-posts.service';
import { BotsService } from '../../bots/services/bots.service';
import { TelegramBotService } from '../../telegram/services/telegram-bot.service';
import { MediaService } from '../../media/services/media.service';
import { getMockImage } from '../../utils/file-upload.utils';
import { TelegramTokensEnum } from '../../telegram/enum/telegram-tokens.enum';
import { OneOffPostsTokensEnum } from '../enums/tokens/one-off-posts.tokens.enum';
import { DiffTypePostsTokensEnum } from '../enums/tokens/diff-type-posts.tokens.enum';
import { MediaTokensEnum } from '../../media/enums/tokens/media.tokens.enum';
import { BotsTokenEnum } from '../../bots/enums/tokens/bots.token.enum';

@Injectable()
export class AllPostsService {
  constructor(
    @Inject(OneOffPostsTokensEnum.ONEOFF_SERVICE_TOKEN)
    private readonly oneTimePostsService: OneoffpostsService,
    @Inject(DiffTypePostsTokensEnum.DIFFTYPEPOSTS_SERVICE_TOKEN)
    private readonly diffTypePostsService: DiffTypePostsService,
    @Inject(TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN)
    private readonly telegramService: TelegramService,
    @Inject(TelegramTokensEnum.TELEGRAM_BOT_SERVICE_TOKEN)
    private readonly telegramBotService: TelegramBotService,
    @Inject(MediaTokensEnum.MEDIA_SERVICE_TOKEN)
    private readonly mediaService: MediaService,
    @Inject(BotsTokenEnum.BOTS_SERVICE_TOKEN)
    private readonly botsService: BotsService,
  ) {}

  async getAllPosts(botId: number, query) {
    const { offset = 0, limit = 6 } = query;
    const { botSession } = await this.botsService.findBotById(botId, {
      select: ['botSession'],
    });
    const client = await this.telegramBotService.getTelegramBot(botSession);
    const posts = await this.diffTypePostsService.repo
      .createQueryBuilder('posts')
      .innerJoin('posts.bot', 'bot', 'bot.id=:botId', { botId })
      .leftJoin('posts.attachedPreview', 'attachedPreview')
      .orderBy('posts.id', 'DESC')
      .select(['posts.id', 'posts.type'])
      .take(limit)
      .skip(offset)
      .select([
        'posts.id',
        'posts.type',
        'attachedPreview.id',
        'posts.createdAt',
        'posts.title',
      ])
      .getMany();
    const postsWithPreview = await Promise.all(
      posts.map(async (e) => {
        const file = await this.mediaService.getMediaById(
          e.attachedPreview?.id,
        );
        e.attachedPreview = file;
        return e;
      }),
    );
    const result = await Promise.all(
      postsWithPreview.map(async (e) => {
        let file;
        if (e.attachedPreview) {
          file = await this.telegramService.downloadFileV2(
            e.attachedPreview,
            client,
          );
        } else {
          file = getMockImage();
        }
        return {
          id: e.id,
          title: e.title,
          type: e.type,
          createdAt: e.createdAt,
          file,
        };
      }),
    );
    return result;
  }

  async getPostsCount(botId: number) {
    const allCount = (await this.diffTypePostsService.getCountByBot(
      botId,
    )) as any;
    const totalCount = allCount.reduce(
      (a, b) => {
        return { count: a.count + b.count };
      },
      {
        count: 0,
        type: '',
      },
    );
    const oneOffPostsCount =
      allCount.find((e) => e.type === 'one-off')?.count || 0;
    const coursePostsCount =
      allCount.find((e) => e.type === 'course')?.count || 0;
    const subscribePostsCount =
      allCount.find((e) => e.type === 'subscribe')?.count || 0;
    return {
      oneOffPostsCount,
      coursePostsCount,
      subscribePostsCount,
      totalCount: totalCount.count,
    };
  }
}
