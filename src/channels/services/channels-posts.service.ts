import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateChannelPostDto } from '../dto/create-channel-post.dto';
import { TelegramService } from '../../telegram/services/telegram.service';
import { TelegramBotService } from '../../telegram/services/telegram-bot.service';
import { MediaService } from '../../media/services/media.service';
import { EditChannelPostDto } from '../dto/edit-channel-post.dto';
import { ChannelPostEntity } from '../entities/channel-post.entity';
import { getDate } from '../../utils/time.utils';
import { addDays, compareAsc, format, getUnixTime, subDays } from 'date-fns';
import {
  FindOneOptions,
  RemoveOptions,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { ChannelsEntity } from '../entities/channels.entity';
import { SizesEnum } from '../../media/enums/sizesEnum';
import { Api, TelegramClient } from 'telegram';
import { SortTypeEnum } from '../enums/sort-type.enum';
import { UploadFilesDto } from '../../posts/dto/upload.files.dto';
import { MediaV3Entity } from '../../media/entities/media-v3.entity';
import { Entity } from 'telegram/define';
import { sortByHisIds } from '../../utils/file-upload.utils';
import { TelegramTokensEnum } from '../../telegram/enum/telegram-tokens.enum';
import { MediaTokensEnum } from '../../media/enums/tokens/media.tokens.enum';
import { ChannelsPostsTokensEnum } from '../enums/tokens/channels-posts.tokens.enum';

@Injectable()
export class ChannelsPostsService {
  logger = new Logger();

  constructor(
    @Inject(TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN)
    private readonly telegramService: TelegramService,
    @Inject(TelegramTokensEnum.TELEGRAM_BOT_SERVICE_TOKEN)
    private readonly telegramBotService: TelegramBotService,
    @Inject(MediaTokensEnum.MEDIA_SERVICE_TOKEN)
    private readonly mediaService: MediaService,
    @Inject(ChannelsPostsTokensEnum.CHANNELS_POSTS_REPOSITORY_TOKEN)
    private readonly channelPostRepo: Repository<ChannelPostEntity>,
  ) {}

  get repo() {
    return this.channelPostRepo;
  }

  async getPostByIdAndChannelId(channelId: number, postId) {
    try {
      const sqlFirst = this.sqlFindInChannel(channelId).andWhere(
        'posts.id=:postId',
        { postId },
      );
      const { withFiles, nextSql } = await this.checkIfFilesInPost(sqlFirst);
      const post = await nextSql.getOne();
      if (withFiles) {
        const files = await this.getFilesFromPost(nextSql);
        post.attachedfiles = files;
      }
      return post;
    } catch (e) {
      throw new NotFoundException('На канале не найдена такого поста');
    }
  }

  async getPost(channel: ChannelsEntity, postId: number) {
    const post = await this.getPostByIdAndChannelId(channel.id, postId);
    const client = await this.telegramService.getTelegramClient(
      channel.user.sessionHash,
    );
    const files = await Promise.all(
      post.attachedfiles.map(async (elem) => {
        return await this.telegramService.downloadFileV2(
          elem,
          client,
          SizesEnum.MAX,
        );
      }),
    );
    let wasPublished = true;
    if (post.scheduled) {
      const peer = await this.telegramService.getChannelEntity(
        channel.channelId,
        client,
      );
      const getScheduled = new Api.messages.GetScheduledMessages({
        peer,
        id: [post.messageId],
      });
      const result = (await client.invoke(getScheduled)) as any;
      wasPublished = !result.messages[0]?.peerId;
    }
    return {
      title: post.title,
      description: post.description,
      publicationDate: post.datePublic,
      wasPublished,
      attachedFiles: files,
    };
  }

  async findById(id: number, options?: FindOneOptions<ChannelPostEntity>) {
    return await this.channelPostRepo.findOne({
      ...{ where: { id } },
      ...options,
    });
  }

  async getPostsByDate(day: string, channel: ChannelsEntity) {
    const dateFrom = new Date(`${day} 00:00`);
    const dateTo = new Date(`${day} 23:59:59`);
    const filters = {
      dateFrom: dateFrom.toISOString() as any,
      dateTo: dateTo.toISOString() as any,
    };
    const { sql, count } = await this.checkIfIdsInPeriodExists(
      filters,
      channel.id,
    );
    if (!count) {
      return {
        posts: [],
        sessionHash: channel.user.sessionHash,
        chId: channel.channelId,
      };
    }
    const { withFiles, withoutFiles, nextSql } = await this.checkIfFilesInPosts(
      sql,
    );
    const postsWithout = await this.getPostsWithoutFiles(
      nextSql,
      withoutFiles.map((e) => e.id),
    );
    const postsWith = await this.getPostsWithFiles(
      postsWithout.nextSql,
      withFiles.map((e) => e.id),
    );
    const posts = sortByHisIds(
      [...postsWith, ...postsWithout.posts],
      SortTypeEnum.DESC,
    );
    return {
      posts: (posts as any) || [],
      sessionHash: channel.user.sessionHash,
      chId: channel.channelId,
    };
  }

  async getPostsWithoutFiles(
    prevSql: SelectQueryBuilder<ChannelPostEntity>,
    ids: Array<number>,
  ) {
    const nextSql = await prevSql
      .orderBy('posts.id', 'DESC')
      .select([
        'posts.id',
        'posts.scheduled',
        'posts.datePublic',
        'attachedfiles',
        'posts.title',
        'posts.description',
        'posts.messageId',
      ]);
    const posts = await nextSql.clone().whereInIds(ids).getMany();
    return { posts, nextSql };
  }

  getSQLWithoutFiles(sql: SelectQueryBuilder<ChannelPostEntity>) {
    return sql
      .orderBy('posts.id', 'DESC')
      .select([
        'posts.id',
        'posts.scheduled',
        'posts.datePublic',
        'attachedfiles',
        'posts.title',
        'posts.description',
        'posts.messageId',
      ]);
  }

  async getPostsWithFiles(
    nextSql: SelectQueryBuilder<ChannelPostEntity>,
    ids: Array<number>,
  ) {
    const documentsId = await nextSql
      .clone()
      .innerJoin('attachedfiles.document', 'document')
      .whereInIds(ids)
      .select(['posts.id'])
      .getMany();
    const photosId = await nextSql
      .clone()
      .innerJoin('attachedfiles.photo', 'photo')
      .whereInIds(ids)
      .select(['posts.id'])
      .getMany();
    const phoIds = photosId.map((e) => e.id);
    const docIds = documentsId
      .map((e) => e.id)
      .filter((e) => !phoIds.includes(e));
    const docs = await nextSql
      .clone()
      .innerJoinAndSelect('attachedfiles.document', 'document')
      .leftJoinAndSelect('document.thumbs', 'thumbs')
      .leftJoinAndSelect('document.videothumbs', 'videothumbs')
      .leftJoinAndSelect('document.attributes', 'attributes')
      .whereInIds(docIds)
      .getMany();
    const photos = await nextSql
      .clone()
      .innerJoinAndSelect('attachedfiles.photo', 'photo')
      .leftJoinAndSelect('photo.sizes', 'sizes')
      .leftJoinAndSelect('photo.videosizes', 'videosizes')
      .whereInIds(phoIds)
      .getMany();
    return [...photos, ...docs];
  }

  async getFilesFromPost(nextSql: SelectQueryBuilder<ChannelPostEntity>) {
    const ifDocs = await nextSql
      .clone()
      .innerJoin('attachedfiles.document', 'document')
      .select(['posts.id'])
      .getOne();
    const ifPhotos = await nextSql
      .clone()
      .innerJoin('attachedfiles.photo', 'photo')
      .select(['posts.id'])
      .getOne();
    const docs = ifDocs
      ? await nextSql
          .clone()
          .innerJoinAndSelect('attachedfiles.document', 'document')
          .leftJoinAndSelect('document.thumbs', 'thumbs')
          .leftJoinAndSelect('document.videothumbs', 'videothumbs')
          .leftJoinAndSelect('document.attributes', 'attributes')
          .getOne()
      : { attachedfiles: [] as any as Array<MediaV3Entity> };
    const photos = ifPhotos
      ? await nextSql
          .clone()
          .innerJoinAndSelect('attachedfiles.photo', 'photo')
          .leftJoinAndSelect('photo.sizes', 'sizes')
          .leftJoinAndSelect('photo.videosizes', 'videosizes')
          .getOne()
      : { attachedfiles: [] as any as Array<MediaV3Entity> };
    const files = [...photos.attachedfiles, ...docs.attachedfiles];
    return sortByHisIds<MediaV3Entity>(files, SortTypeEnum.INC);
  }

  async checkIfFilesInPosts(sql: SelectQueryBuilder<ChannelPostEntity>) {
    const nextSql = sql.leftJoinAndSelect(
      'posts.attachedfiles',
      'attachedfiles',
    );
    const posts = await sql
      .clone()
      .loadRelationCountAndMap(
        'posts.filesCount',
        'posts.attachedfiles',
        'attachedfiles',
      )
      .select(['posts.id'])
      .getMany();
    return {
      withFiles: posts.filter((e) => !!(e as any).filesCount),
      withoutFiles: posts.filter((e) => !(e as any).filesCount),
      nextSql: nextSql.clone(),
    };
  }

  async checkIfFilesInPost(sql: SelectQueryBuilder<ChannelPostEntity>) {
    const nextSql = sql.leftJoinAndSelect(
      'posts.attachedfiles',
      'attachedfiles',
    );
    const post = await sql
      .clone()
      .loadRelationCountAndMap(
        'posts.filesCount',
        'posts.attachedfiles',
        'attachedfiles',
      )
      .select(['posts.id'])
      .getOne();
    return {
      withFiles: !!(post as any).filesCount,
      nextSql: nextSql.clone(),
    };
  }

  sqlFindInChannel(channelId: number) {
    return this.channelPostRepo
      .createQueryBuilder('posts')
      .innerJoin('posts.channel', 'channel')
      .where('channel.id=:channelId', { channelId })
      .clone();
  }

  async checkIfIdsInPeriodExists(filters, channelId) {
    const sql = this.sqlFindInChannel(channelId)
      .andWhere('posts."datePublic">:dateFrom and posts."datePublic"<:dateTo')
      .setParameters(filters);
    const count = await sql.getCount();
    return { count, sql: sql.clone() };
  }

  async getPostsAtDay(channel: ChannelsEntity, query) {
    const { posts, sessionHash, chId } = await this.getPostsByDate(
      query.day,
      channel,
    );
    if (!posts.length) {
      return { posts: [], count: 0 };
    }
    const client = await this.telegramService.getTelegramClient(sessionHash);
    const peer = await this.telegramService.getChannelEntity(chId, client);
    const getScheduled = new Api.messages.GetScheduledMessages({
      peer,
      id: posts.filter((e) => e.scheduled).map((e) => e.messageId),
    });
    const result = (await client.invoke(getScheduled)) as any;
    const resultPosts = await Promise.all(
      posts.map(async (elem) => {
        const wasPublished = elem.scheduled
          ? !result.messages.find((e) => e.id === elem.messageId)?.peerId
          : true;
        const file = await this.telegramService.downloadFileV2(
          elem.attachedfiles[0],
          client,
          SizesEnum.MEDIUM,
        );
        const {
          messageId,
          attachedfiles,
          messageIds,
          scheduled,
          datePublic,
          ...rest
        } = elem;
        return { ...rest, wasPublished, publicationDate: datePublic, file };
      }),
    );

    return { posts: resultPosts, count: resultPosts.length };
  }

  async getPostsCountInPerioud(
    dateFrom: Date,
    dateTo: Date,
    channelId: number,
  ) {
    const filters = {
      dateFrom: dateFrom.toISOString() as any,
      dateTo: dateTo.toISOString() as any,
    };
    return await this.channelPostRepo
      .createQueryBuilder('posts')
      .innerJoin('posts.channel', 'channel')
      .where(`posts."datePublic">= :dateFrom and posts."datePublic"<= :dateTo`)
      .andWhere('channel.id=:channelId', { channelId: channelId })
      .setParameters(filters)
      .select('EXTRACT(YEAR FROM posts."datePublic") as year')
      .addSelect('EXTRACT(DAY FROM posts."datePublic") as day')
      .addSelect('EXTRACT(MONTH FROM posts."datePublic") as month')
      .addSelect('COUNT(*) as count')
      .groupBy('year,day,month')
      .getRawMany();
  }

  async getPostsInPeriod(channelId: number, query) {
    const dateFrom = subDays(new Date(`${query.dateFrom} 00:00`), 1);
    const dateTo = subDays(new Date(`${query.dateTo} 23:59:59`), 1);
    const posts = await this.getPostsCountInPerioud(
      dateFrom,
      dateTo,
      channelId,
    );
    const normFormat = posts.map((e) => {
      const date = format(
        new Date(e.year, Number(e.month) - 1, e.day),
        'yyyy-MM-dd',
      );
      return { count: Number(e.count), date };
    });
    return this.getPeriodCounts(dateFrom, dateTo, normFormat);
  }

  getPeriodCounts(dateFrom: Date, dateTo: Date, normFormat) {
    let currDate = dateFrom;
    const result = [];
    while (compareAsc(currDate, dateTo) !== 1) {
      currDate = addDays(currDate, 1);
      const toDate = normFormat.find((e) => e.date === getDate(currDate)) || {
        count: 0,
        date: getDate(currDate),
      };
      result.push(toDate);
    }
    return result;
  }

  async createChannelPost(
    channel: ChannelsEntity,
    data: CreateChannelPostDto,
    files,
  ) {
    const { client, peer } =
      await this.telegramService.preparePropertiesForChannel(
        channel.channelId,
        channel.user.sessionHash,
      );
    const newPostEntity = await this.prepareFilesForPost(
      client,
      peer,
      channel,
      data,
      files,
    );
    const result = await this.save(newPostEntity);

    return result;
  }

  async deletePost(channel: ChannelsEntity, postId: number) {
    const post = await this.channelPostRepo.findOne({
      where: { id: postId },
      select: ['messageIds'],
    });
    const client = await this.telegramService.getTelegramClient(
      channel.user.sessionHash,
    );
    const peer = await this.telegramService.getChannelEntity(
      channel.channelId,
      client,
    );
    try {
      await client.invoke(
        new Api.messages.DeleteScheduledMessages({
          peer,
          id: JSON.parse(post.messageIds),
        }),
      );
      await this.channelPostRepo.delete(postId);
    } catch (e) {
      throw new BadRequestException(e);
    }
    return { text: 'Пост успешно удалён' };
  }

  async prepareFilesForPost(
    client: TelegramClient,
    peer: Entity,
    channel: ChannelsEntity,
    data: EditChannelPostDto | CreateChannelPostDto,
    files: UploadFilesDto,
    media: MediaV3Entity[] = [],
  ) {
    const dateTime = new Date(`${data.datePublic} ${data.timePublic}`);
    const schedule = getUnixTime(dateTime);
    const fullText = this.telegramBotService.makeMessageFull(
      data.title,
      data.description,
    );
    const mediaV3 = await this.mediaService.prepareOneTypeMessage(
      client,
      channel.channelId,
      files.files,
    );
    const attachedfiles = [...mediaV3, ...media];
    const locations = attachedfiles.map((e) => {
      return this.telegramService.getLocation(e, SizesEnum.MAX);
    });
    const inputMedias = locations.map((e) =>
      this.telegramService.prepareMediaToSend(e.location, e.mimeType),
    );
    const resultElem = await this.mediaService.sendMessFile(
      { peer, fullText, schedule, files: inputMedias },
      client,
    );
    const scheduled = resultElem[0] ? !resultElem[0]?.views : !resultElem.views;
    const messageId = resultElem[0] ? resultElem[0]?.id : resultElem.id;
    const ids = resultElem.id ? [resultElem.id] : resultElem.map((e) => e?.id);
    return this.create({
      title: data.title,
      description: data.description,
      datePublic: dateTime,
      scheduled,
      attachedfiles,
      messageId,
      messageIds: JSON.stringify(ids),
      channel: channel,
    }) as any as ChannelPostEntity;
  }

  async editChannelPost(
    channel: ChannelsEntity,
    id: number,
    data: EditChannelPostDto,
    files: UploadFilesDto,
  ) {
    const idsTo = data.idsToDelete
      ? typeof data.idsToDelete === 'object'
        ? data.idsToDelete
        : [data.idsToDelete]
      : [];
    const idsToDelete = idsTo.map((e) => Number(e));
    const client = await this.telegramService.getTelegramClient(
      channel.user.sessionHash,
    );
    const peer = await this.telegramService.getChannelEntity(
      channel.channelId,
      client,
    );
    const { attachedfiles, messageIds } = await this.getPostByIdAndChannelId(
      channel.id,
      id,
    );
    await client.invoke(
      new Api.messages.DeleteScheduledMessages({
        peer,
        id: JSON.parse(messageIds),
      }),
    );
    const newPostEntity = await this.prepareFilesForPost(
      client,
      peer,
      channel,
      data,
      files,
      attachedfiles.filter((e) => !idsToDelete.includes(e.id)),
    );
    newPostEntity.id = id;
    const result = await this.save(newPostEntity);

    return result;
  }

  async save(data: any) {
    return await this.channelPostRepo.save(data);
  }

  create(data: any) {
    return this.channelPostRepo.create(data);
  }

  async remove(data: any, options?: RemoveOptions) {
    return await this.channelPostRepo.remove(data, options);
  }

  async findOneByIdWithOpts(
    id: number,
    options?: FindOneOptions<ChannelPostEntity>,
  ) {
    return await this.channelPostRepo.findOne({
      ...{ where: { id } },
      ...options,
    });
  }
}
