import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { EditOneTimePostDto } from '../../dto/bots/one-time-posts/edit-one-time-post.dto';
import { BotsService } from '../../../bots/services/bots.service';
import { BotEntity } from '../../../bots/entities/bot.entity';
import { MediaService } from '../../../media/services/media.service';
import { UsersCenterService } from '../../../users-center/users-center.service';
import { TelegramBotService } from '../../../telegram/services/telegram-bot.service';
import { TelegramService } from '../../../telegram/services/telegram.service';
import { TelegramClient } from 'telegram';
import { CreateOneTimePostDto } from '../../dto/bots/one-time-posts/create-one-time-post.dto';
import { FilesContentDto } from '../../../media/dto/files.content.dto';
import { Mediav3Service } from '../../../media/services/mediav3.service';
import { TypeOfPostsEnum } from '../../enums/type-of-posts.enum';
import { DiffTypePostsService } from './diff-type-posts.service';
import { DiffTypePostsEntity } from '../../entities/posts/diff-type-posts.entity';
import { FindOneOptions } from 'typeorm';
import { SizesEnum } from '../../../media/enums/sizesEnum';
import { getMockImage } from '../../../utils/file-upload.utils';
import { UserCenterTokensEnum } from '../../../users-center/enum/users-center-tokens.enum';
import { TelegramTokensEnum } from '../../../telegram/enum/telegram-tokens.enum';
import { DiffTypePostsTokensEnum } from '../../enums/tokens/diff-type-posts.tokens.enum';
import { MediaTokensEnum } from '../../../media/enums/tokens/media.tokens.enum';
import { MediaV3TokensEnum } from '../../../media/enums/tokens/media-v3.tokens.enum';
import { BotsTokenEnum } from '../../../bots/enums/tokens/bots.token.enum';

@Injectable()
export class OneoffpostsService {
  constructor(
    @Inject(DiffTypePostsTokensEnum.DIFFTYPEPOSTS_SERVICE_TOKEN)
    private readonly diffTypePostsService: DiffTypePostsService,
    @Inject(forwardRef(() => BotsTokenEnum.BOTS_SERVICE_TOKEN))
    private readonly botService: BotsService,
    @Inject(MediaTokensEnum.MEDIA_SERVICE_TOKEN)
    private readonly mediaService: MediaService,
    @Inject(MediaV3TokensEnum.MEDIA_V3_SERVICE_TOKEN)
    private readonly mediaV3Service: Mediav3Service,
    @Inject(UserCenterTokensEnum.USER_CENTER_SERVICE_TOKEN)
    private readonly usersCenterService: UsersCenterService,
    @Inject(TelegramTokensEnum.TELEGRAM_BOT_SERVICE_TOKEN)
    private readonly telegramBotService: TelegramBotService,
    @Inject(TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN)
    private readonly telegramService: TelegramService,
  ) {}

  async getAllPosts(botId: number, query) {
    const { offset = 0, limit = 6 } = query;
    const { botSession } = await this.botService.findBotById(botId, {
      select: ['botSession'],
    });
    const client = await this.telegramBotService.getTelegramBot(botSession);
    const posts = await this.diffTypePostsService.repo
      .createQueryBuilder('P')
      .innerJoin('P.bot', 'bot')
      .where('bot.id=:botId', { botId })
      .andWhere('P.type=:type', { type: TypeOfPostsEnum.ONETIMEPOSTS })
      .leftJoin('P.attachedSpoiler', 'attachedSpoiler')
      .leftJoin('P.attachedPreview', 'attachedPreview')
      .limit(limit)
      .skip(offset)
      .orderBy('P.id', 'DESC')
      .select(['P.id', 'P.title', 'P.createdAt', 'attachedPreview.id'])
      .getMany();
    const result = await Promise.all(
      posts.map(async (e) => {
        let file;
        const { attachedPreview, ...rest } = e;
        if (attachedPreview) {
          const media = await this.mediaService.getMediaById(
            attachedPreview.id,
          );
          file = await this.telegramService.downloadFileV2(media, client);
        } else {
          file = getMockImage();
        }
        return { ...rest, file };
      }),
    );
    return result;
  }

  async getOne(id: number) {
    const { bot, ...post } = await this.diffTypePostsService.repo
      .createQueryBuilder('posts')
      .where('posts.id=:id', { id })
      .andWhere('posts.type=:type', { type: TypeOfPostsEnum.ONETIMEPOSTS })
      .leftJoinAndSelect('posts.attachedPreview', 'attachedPreview')
      .leftJoinAndSelect('posts.attachedSpoiler', 'attachedSpoiler')
      .leftJoin('posts.bot', 'bot')
      .addSelect(['bot.botSession'])
      .getOne();
    const client = await this.telegramBotService.getTelegramBot(bot.botSession);
    post.attachedPreview = await this.mediaService.getMediaById(
      post.attachedPreview?.id,
    );
    post.attachedSpoiler = await Promise.all(
      post.attachedSpoiler.map(async (e) => {
        return await this.mediaService.getMediaById(e.id);
      }),
    );

    const { attachedSpoiler, attachedPreview, ...rest } = post;
    const spoilerDownloaded = await Promise.all(
      attachedSpoiler.map(async (e) => {
        return await this.telegramService.downloadFileV2(
          e,
          client,
          SizesEnum.MAX,
        );
      }),
    );
    const previewDownloaded = await this.telegramService.downloadFileV2(
      attachedPreview,
      client,
      SizesEnum.MAX,
    );

    const result = {
      id: rest.id,
      cost: rest.cost,
      currency: rest.currency,
      createdAt: rest.createdAt,
      title: rest.title,
      description: rest.description,
      previewDescription: rest.previewDescription,
      previewFile: previewDownloaded,
      spoilerFiles: spoilerDownloaded,
    };
    return result;
  }

  async createBotPost(data: CreateOneTimePostDto, files: FilesContentDto) {
    const bot = await this.botService.findBotById(data.botId, {
      select: ['botSession', 'id'],
    });
    const botClient = await this.telegramBotService.getTelegramBot(
      bot.botSession,
    );
    const result = await this.createPostBot(
      botClient,
      bot,
      process.env.ADMIN_CHANNEL_ID,
      data,
      files,
    );
    return result;
  }

  async findOneByIdWithOpts(
    id: number,
    options?: FindOneOptions<DiffTypePostsEntity>,
  ) {
    return await this.diffTypePostsService.repo.findOne({
      ...{ where: { id, type: TypeOfPostsEnum.ONETIMEPOSTS } },
      ...options,
    });
  }

  async createPostBot(
    botClient: TelegramClient,
    bot: BotEntity,
    channelId: string,
    data: CreateOneTimePostDto | EditOneTimePostDto,
    files: FilesContentDto,
  ) {
    return await this.diffTypePostsService.createContentPart(
      data,
      files,
      botClient,
      channelId,
      bot,
      TypeOfPostsEnum.ONETIMEPOSTS,
    );
  }

  async editPost(id: number, data: EditOneTimePostDto, file: FilesContentDto) {
    const { spoilerFiles = [], previewFile = [] } = file;
    const idsToDel = data.idsToDelete
      ? typeof data.idsToDelete === 'object'
        ? data.idsToDelete
        : [data.idsToDelete]
      : [];
    const idsToDelete = idsToDel.map((e) => Number(e));
    const post = await this.diffTypePostsService.repo
      .createQueryBuilder('post')
      .where('post.id=:id', { id })
      .innerJoin('post.bot', 'bot')
      .leftJoin('post.attachedSpoiler', 'attachedSpoiler')
      .leftJoin('post.attachedPreview', 'attachedPreview')
      .select([
        'bot.botSession',
        'bot.id',
        'post.id',
        'attachedPreview.id',
        'attachedSpoiler.id',
      ])
      .getOne();
    post.cost = Number(data.cost);
    post.currency = data.currency;
    post.description = data.description;
    post.previewDescription = data.previewDescription;
    post.title = data.title;
    const resPost = this.clearPostFromFilesWithId(post, idsToDelete);
    const client = await this.telegramBotService.getTelegramBot(
      post.bot.botSession,
    );
    if (previewFile.length) {
      const file = await this.mediaService.prepareOneTypeMessage(
        client,
        process.env.ADMIN_CHANNEL_ID,
        previewFile,
      );
      resPost.attachedPreview = file[0];
    }
    if (spoilerFiles.length) {
      if (spoilerFiles.length + resPost.attachedSpoiler.length > 10) {
        throw new BadRequestException(
          'Суммарное кол-во файлов на основной контент превышает 10-ти',
        );
      }
      const files = await this.mediaService.prepareOneTypeMessage(
        client,
        process.env.ADMIN_CHANNEL_ID,
        spoilerFiles,
      );
      resPost.attachedSpoiler = [...resPost.attachedSpoiler, ...files];
    }
    return await this.diffTypePostsService.repo.save(resPost);
  }

  clearPostFromFilesWithId(post: DiffTypePostsEntity, idsToDelete: number[]) {
    if (post.attachedPreview) {
      post.attachedPreview = idsToDelete.includes(post.attachedPreview.id)
        ? null
        : post.attachedPreview;
    }
    if (post.attachedSpoiler.length) {
      post.attachedSpoiler = post.attachedSpoiler.filter(
        (e) => !idsToDelete.includes(e.id),
      );
    }
    return post;
  }

  async deletePost(id: number) {
    try {
      const post = await this.diffTypePostsService.repo.findOne({
        select: ['id'],
        where: { id: Number(id) },
      });
      return await this.diffTypePostsService.repo.remove(post);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }
}
