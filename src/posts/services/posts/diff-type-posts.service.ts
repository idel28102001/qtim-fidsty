import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DiffTypePostsEntity } from '../../entities/posts/diff-type-posts.entity';
import { CreateOneTimePostDto } from '../../dto/bots/one-time-posts/create-one-time-post.dto';
import { EditOneTimePostDto } from '../../dto/bots/one-time-posts/edit-one-time-post.dto';
import { FilesContentDto } from '../../../media/dto/files.content.dto';
import { TelegramClient } from 'telegram';
import { MediaService } from '../../../media/services/media.service';
import { TypeOfPostsEnum } from '../../enums/type-of-posts.enum';
import { BotEntity } from '../../../bots/entities/bot.entity';
import { TelegramService } from '../../../telegram/services/telegram.service';
import { SizesEnum } from '../../../media/enums/sizesEnum';
import { Button } from 'telegram/tl/custom/button';
import { Buffer } from 'buffer';
import { TelegramTokensEnum } from '../../../telegram/enum/telegram-tokens.enum';
import { DiffTypePostsTokensEnum } from '../../enums/tokens/diff-type-posts.tokens.enum';
import { MediaTokensEnum } from '../../../media/enums/tokens/media.tokens.enum';

@Injectable()
export class DiffTypePostsService {
  constructor(
    @Inject(DiffTypePostsTokensEnum.DIFFTYPEPOSTS_REPOSITORY_TOKEN)
    private readonly diffTypePostsRepo: Repository<DiffTypePostsEntity>,
    @Inject(MediaTokensEnum.MEDIA_SERVICE_TOKEN)
    private readonly mediaService: MediaService,
    @Inject(TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN)
    private readonly telegramService: TelegramService,
  ) {
    if (!process.env.ADMIN_CHANNEL_ID) {
      throw new Error('ADMIN_CHANNEL_ID отсутствует в env файле');
    }
    if (!process.env.ADMIN_TOKEN) {
      throw new Error('ADMIN_TOKEN отсутствует в env файле');
    }
  }

  async save(some) {
    return await this.diffTypePostsRepo.save(some);
  }

  get repo() {
    return this.diffTypePostsRepo;
  }

  prepareText(title: string, description: string) {
    return `${title}\n\n${description}`;
  }

  async sendWholeMessage(userId, id: string, client: TelegramClient) {
    const post = await this.diffTypePostsRepo
      .createQueryBuilder('posts')
      .leftJoin('posts.attachedSpoiler', 'attachedSpoiler')
      .where('posts.id=:id', { id })
      .select([
        'posts.id',
        'posts.title',
        'posts.description',
        'attachedSpoiler.id',
        'posts.cost',
        'posts.currency',
        'posts.type',
      ])
      .getOne();
    const attachedSpoiler = await Promise.all(
      post.attachedSpoiler.map(async (e) => {
        return this.mediaService.getMediaById(e.id);
      }),
    );
    const text = this.prepareText(post.title, post.description);
    if (attachedSpoiler.length) {
      const locations = attachedSpoiler.map((e) =>
        this.telegramService.getLocation(e, SizesEnum.MAX),
      );
      const files = locations.map((e) =>
        this.telegramService.prepareMediaToSend(e.location, e.mimeType),
      );
      await client.sendFile(userId, {
        caption: text,
        file: files,
      });
    } else {
      await client.sendMessage(userId, { message: text });
    }
  }

  async sendPreview(userId, id: string, client: TelegramClient) {
    const post = await this.diffTypePostsRepo
      .createQueryBuilder('posts')
      .leftJoin('posts.attachedPreview', 'attachedPreview')
      .where('posts.id=:id', { id })
      .select([
        'posts.id',
        'posts.title',
        'posts.previewDescription',
        'attachedPreview.id',
        'posts.cost',
        'posts.currency',
        'posts.type',
      ])
      .getOne();
    const attachedPreview = await this.mediaService.getMediaById(
      post?.attachedPreview?.id,
    );
    const message = `Пост №${post.id}\nЦена: ${post.cost} ${post.currency}`;
    const text = this.prepareText(post.title, post.previewDescription);
    const buttons = client.buildReplyMarkup([
      Button.inline(
        'Купить',
        Buffer.from(JSON.stringify({ type: post.type, id: post.id })),
      ),
      Button.inline(
        'Отказаться',
        Buffer.from(JSON.stringify({ type: 'delete' })),
      ),
    ]);
    if (attachedPreview) {
      const location = this.telegramService.getLocation(
        attachedPreview,
        SizesEnum.MAX,
      );
      const file = this.telegramService.prepareMediaToSend(
        location.location,
        location.mimeType,
      );
      await client.sendFile(userId, {
        caption: text,
        file,
      });
    } else {
      await client.sendMessage(userId, { message: text });
    }
    await client.sendMessage(userId, { message, buttons });
  }

  async getCountByBot(botId: number) {
    const elements = await this.diffTypePostsRepo
      .createQueryBuilder('posts')
      .select('posts.type as type')
      .addSelect('COUNT(*) as count')
      .innerJoin('posts.bot', 'bot')
      .where('bot.id=:botId', { botId })
      .groupBy('posts.type')
      .getRawMany();
    return elements.map((e) => {
      return { type: e.type as string, count: Number(e.count) };
    });
  }

  async createContentPart(
    data: CreateOneTimePostDto | EditOneTimePostDto,
    files: FilesContentDto,
    client: TelegramClient,
    channelId: string,
    bot: BotEntity,
    type: TypeOfPostsEnum,
  ) {
    const attachedPreview = (
      await this.mediaService.prepareOneTypeMessage(
        client,
        channelId,
        files.previewFile,
      )
    )[0];
    const attachedSpoiler = await this.mediaService.prepareOneTypeMessage(
      client,
      channelId,
      files.spoilerFiles,
    );
    const content = this.diffTypePostsRepo.create({
      type,
      attachedPreview,
      attachedSpoiler,
      bot,
      currency: data.currency,
      cost: Number(data.cost),
      title: data.title,
      description: data.description,
      previewDescription: data.previewDescription,
    });
    return await this.diffTypePostsRepo.save(content);
  }
}
