import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateChannelDto } from '../dto/create-channel.dto';
import { TelegramService } from '../../telegram/services/telegram.service';
import { FindOneOptions, Repository } from 'typeorm';
import { ChannelsEntity } from '../entities/channels.entity';
import { EditChannelDto } from '../dto/edit-channel.dto';
import { UsersCenterService } from '../../users-center/users-center.service';
import { NewsubService } from '../../subscribers/services/newsub.service';
import { Api, TelegramClient } from 'telegram';
import { EditChannelProfilePhotoDto } from '../dto/edit-channel-profile-photo.dto';
import { BotsService } from '../../bots/services/bots.service';
import { UserPayloadInterface } from '../../users-center/interfaces/user.payload.interface';
import { ChannelsPostsService } from './channels-posts.service';
import { MediaService } from '../../media/services/media.service';
import { getMockImage } from '../../utils/file-upload.utils';
import { UserCenterTokensEnum } from '../../users-center/enum/users-center-tokens.enum';
import { TelegramTokensEnum } from '../../telegram/enum/telegram-tokens.enum';
import { NewsubsTokensEnum } from '../../subscribers/enums/newsubs-tokens.enum';
import { MediaTokensEnum } from '../../media/enums/tokens/media.tokens.enum';
import { ChannelsTokensEnum } from '../enums/tokens/channels.tokens.enum';
import { ChannelsPostsTokensEnum } from '../enums/tokens/channels-posts.tokens.enum';
import { BotsTokenEnum } from '../../bots/enums/tokens/bots.token.enum';

@Injectable()
export class ChannelsService {
  constructor(
    @Inject(TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN)
    private readonly telegramService: TelegramService,
    @Inject(UserCenterTokensEnum.USER_CENTER_SERVICE_TOKEN)
    private readonly usersCenterService: UsersCenterService,
    @Inject(ChannelsTokensEnum.CHANNELS_REPOSITORY_TOKEN)
    private readonly channelRepository: Repository<ChannelsEntity>,
    @Inject(ChannelsPostsTokensEnum.CHANNELS_POSTS_SERVICE_TOKEN)
    private readonly channelPostsService: ChannelsPostsService,
    @Inject(BotsTokenEnum.BOTS_SERVICE_TOKEN)
    private readonly botsService: BotsService,
    @Inject(NewsubsTokensEnum.NEWSUBS_SERVICE_TOKEN)
    private readonly newsubService: NewsubService,
    @Inject(MediaTokensEnum.MEDIA_SERVICE_TOKEN)
    private readonly mediaService: MediaService,
  ) {}

  async checkChannelInUser(
    userPayload: UserPayloadInterface,
    channelId: number,
  ) {
    try {
      await this.channelRepository
        .createQueryBuilder('channels')
        .innerJoin('channels.user', 'user', 'user.id=:id', {
          id: userPayload.userId,
        })
        .where('channels.id=:channelId', { channelId })
        .getOneOrFail();
    } catch (e) {
      throw new NotFoundException('Такого канала у пользователя нет');
    }
  }

  async getLittleInfo(channelId: number) {
    return await this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.user', 'user')
      .where('channel.id=:channelId', { channelId })
      .select(['channel.id', 'channel.channelId', 'user.sessionHash'])
      .getOne();
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
    return await this.channelRepository
      .createQueryBuilder('channels')
      .innerJoin('channels.posts', 'posts')
      .where(`posts."datePublic"> :dateFrom and posts."datePublic"< :dateTo`)
      .andWhere('channels.id=:channelId', { channelId })
      .setParameters(filters)
      .select('EXTRACT(YEAR FROM posts."datePublic") as year')
      .addSelect('EXTRACT(DAY FROM posts."datePublic") as day')
      .addSelect('EXTRACT(MONTH FROM posts."datePublic") as month')
      .addSelect('COUNT(*) as count')
      .groupBy('year,day,month')
      .getRawMany();
  }

  get repo() {
    return this.channelRepository;
  }

  async findById(id: number, options?: FindOneOptions<ChannelsEntity>) {
    return await this.channelRepository.findOne({
      ...{ where: { id } },
      ...options,
    });
  }

  async findByChannelId(
    channelId: string,
    options?: FindOneOptions<ChannelsEntity>,
  ) {
    return await this.channelRepository.findOne({
      where: { channelId },
      ...options,
    });
  }

  async findByData(options: FindOneOptions<ChannelsEntity>) {
    return await this.channelRepository.findOne(options);
  }

  async save(data: any) {
    return await this.channelRepository.save(data);
  }

  async editChannelProfilePhoto(
    userPayload: UserPayloadInterface,
    photo: EditChannelProfilePhotoDto,
    id: number,
  ) {
    const channel = await this.channelRepository.findOne({ where: { id } });
    const { sessionHash } = await this.usersCenterService.findOneByIdWithOpts(
      userPayload.userId,
    );
    const client = await this.telegramService.getTelegramClient(sessionHash);
    await this.telegramService.editProfilePhoto(
      client,
      photo,
      this.telegramService.makeChannelId(channel.channelId),
    );
    await client.disconnect();
    return { status: 'ok' };
  }

  async createChannel(
    dto: CreateChannelDto,
    userPayload: UserPayloadInterface,
    photo,
    justCreate = false,
  ) {
    const user = await this.usersCenterService.findOneByIdWithOpts(
      userPayload.userId,
      {
        select: ['sessionHash', 'id'],
      },
    );
    const client = await this.telegramService.getTelegramClient(
      user.sessionHash,
    );
    const checkUsername = dto.username
      ? await this.telegramService.checkUsername(dto.username, client)
      : true;
    if (!checkUsername) {
      throw new BadRequestException('Нельзя установить такой username');
    }
    const telegramChannel = await this.telegramService.createChannel(
      dto,
      client,
    );
    const channelId = this.telegramService.returnChId(
      telegramChannel.chats[0].id.toString(),
    );
    const toAwait = [];
    dto.username &&
      toAwait.push(
        this.telegramService.channelEditUsername(
          dto.username,
          channelId,
          client,
        ),
      );
    photo &&
      toAwait.push(
        this.telegramService.editProfilePhoto(client, photo, channelId),
      );
    await Promise.all(toAwait);
    await client.disconnect();
    if (justCreate) return channelId;
    const channel = this.channelRepository.create({
      ...dto,
      channelId,
    });
    channel.user = user;
    return await this.channelRepository.save(channel);
  }

  async addAdmin(channelId, username) {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['user'],
    });
    const { sessionHash } = channel.user;
    const client = await this.telegramService.getTelegramClient(sessionHash);
    const result = await this.telegramService.addAdminToChannel(
      channel.channelId,
      username,
      client,
    );
    await client.disconnect();
    return result;
  }

  async getChannel(channelId: number) {
    const channelEnt = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['user'],
    });
    const { user, ...channelEn } = channelEnt;
    const client = await this.telegramService.getTelegramClient(
      user.sessionHash,
    );
    const channel = await client.getEntity(
      this.telegramService.makeChannelId(channelEn.channelId),
    );
    const link = client.invoke(
      new Api.messages.ExportChatInvite({ peer: channel }),
    );
    const photo = await this.telegramService.downloadPhoto(client, channel);
    const participants = await client.getParticipants(channel, {});
    const users = participants.filter((e) => !e.bot);
    const all = Promise.all(
      users.map(async (curr) => {
        const photo = await this.telegramService.downloadPhoto(client, curr);
        return {
          link: `t.me/${curr.username}`,
          username: `@${curr.username}`,
          photo,
        };
      }),
    );
    const last5Posts = await this.getPosts(5, client, channelId);
    const result = {
      ...channelEn,
      link: ((await link) as any).link,
      photo,
      subscribers: await all,
      posts: channelEnt.posts,
      last5Posts,
    };
    await client.disconnect();
    return result;
  }

  async getPosts(limit: number, client: TelegramClient, channelId: number) {
    const posts = await this.channelPostsService.repo
      .createQueryBuilder('posts')
      .orderBy('posts.id', 'DESC')
      .innerJoin('posts.channel', 'channel', 'channel.id=:channelId', {
        channelId,
      })
      .limit(limit)
      .leftJoin('posts.attachedfiles', 'attachedfiles')
      .select([
        'posts.id',
        'posts.title',
        'posts.createdAt',
        'attachedfiles.id',
      ])
      .getMany();
    return await Promise.all(
      posts.map(async (e) => {
        const { attachedfiles, ...rest } = e;
        let photo;
        if (attachedfiles.length) {
          const media = await this.mediaService.getMediaById(
            attachedfiles[0].id,
          );
          photo = await this.telegramService.downloadFileV2(media, client);
        } else {
          photo = getMockImage();
        }
        return { ...rest, photo };
      }),
    );
  }

  async getAllChannels(userPayload: UserPayloadInterface) {
    const user = await this.usersCenterService.findOneByIdWithOpts(
      userPayload.userId,
      { select: ['sessionHash'], relations: ['channels'] },
    );
    const allChannels = await this.telegramService.getAllChannels(
      user.sessionHash,
      this,
    );
    const channels = new Map();
    user.channels.forEach((e) => {
      channels.set(this.telegramService.returnChId(e.channelId), e.id);
    });
    return await Promise.all(
      allChannels.map(async ({ channel, photo, total, newSubs }) => {
        const chId = channel.entity.id.toString();
        const id = channels.get(this.telegramService.returnChId(chId)) || null;
        let postsCount = 0;
        if (id) {
          postsCount = await this.countPosts(id);
        }
        return {
          channelId: chId,
          title: channel.title,
          link: channel.entity.username
            ? `https://t.me/${channel.entity.username}`
            : null,
          id, // Проверка на наличие id в БД
          subscribersCount: total,
          newSubs,
          photo,
          postsCount,
        };
      }),
    ); // Возвращаем объекты;
  }

  async countPosts(channelId: number) {
    const count = ((await this.channelRepository
      .createQueryBuilder('channel')
      .where('channel.id=:channelId', { channelId })
      .loadRelationCountAndMap('channel.postsCount', 'channel.posts', 'posts')
      .select(['channel.id'])
      .getOne()) as ChannelsEntity) && { postsCount: 0 };
    return count.postsCount;
  }

  async addChannel(tgChannelId: string, userPayload: UserPayloadInterface) {
    const user = await this.usersCenterService.findOneByIdWithOpts(
      userPayload.userId,
      { relations: ['channels'], select: ['id', 'channels', 'sessionHash'] },
    );
    const { sessionHash } = user;
    const tgChannel = await this.telegramService.getChannelByChannelId(
      tgChannelId,
      sessionHash,
    );
    const about = tgChannel.fullChat.about; // Получаем описание
    const title = (tgChannel.chats[0] as any).title; // Получаем заголовок
    const username = (tgChannel.chats[0] as any).username; // Получаем username
    const channelE = this.channelRepository.create({
      title,
      about,
      username,
      channelId: tgChannelId,
    });
    user.channels.push(channelE);
    const channels = await this.usersCenterService.save(user);
    return channels.channels.slice(-1)[0];
  }

  async removeFromDBChannel(channelId: number) {
    return await this.channelRepository.delete(channelId);
  }

  async deleteChannel(channelId: number, userPayload: UserPayloadInterface) {
    const user = await this.usersCenterService.findOneByIdWithOpts(
      userPayload.userId,
    );
    const { sessionHash } = user;
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      select: ['channelId'],
    });
    await this.telegramService.deleteChannel(channel.channelId, sessionHash);
    return await this.channelRepository.delete(channelId);
  }

  delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  changeFunc = async ({ object, channel, sessionHash }) => {
    if (!object.change) return;
    switch (object.name) {
      case 'title': {
        return this.telegramService.editTitle(
          object.data,
          channel.channelId,
          sessionHash,
        );
      }
      case 'about': {
        return this.telegramService.editAbout(
          object.data,
          channel.channelId,
          sessionHash,
        );
      }
      case 'username': {
        const checkUsername =
          await this.telegramService.checkUsernameForEditChannel(
            object.data,
            channel.channelId,
            sessionHash,
          );
        if (!checkUsername)
          throw new BadRequestException('Такой username нельзя установить');
        return this.telegramService.channelEditUsername(
          object.data,
          channel.channelId,
          sessionHash,
        );
      }
    }
  };

  async editChannel(
    channelId: number,
    dto: EditChannelDto,
    userPayload: UserPayloadInterface,
  ) {
    const user = await this.usersCenterService.findOneByIdWithOpts(
      userPayload.userId,
    );
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      select: ['id', 'username', 'title', 'about', 'channelId'],
    });
    const { sessionHash } = user;
    const all = ['title', 'about', 'username'];
    const change = [];
    all.forEach((e) => {
      const prev = channel[e] ? channel[e] : '';
      const next = dto[e] ? dto[e] : '';
      change.push({ data: dto[e], change: prev !== next, name: e });
    });

    const someFunc = () => {
      return {
        get: (i) => this.delay(100).then(() => change[i]),
      };
    };
    const delayFunc = someFunc();

    const iterator = {
      [Symbol.asyncIterator]: () => {
        let i = 0;
        return {
          next: async () => {
            const elem = await delayFunc.get(i++);
            if (!elem) {
              return { done: true };
            }
            await this.changeFunc({ object: elem, channel, sessionHash });
            if (elem.change) {
              const dict: Record<string, string> = {};
              dict[elem.name] = elem.data;
              await this.channelRepository.update(channel.id, dict);
            }
            return { done: false, value: elem };
          },
        };
      },
    };
    for await (const curr of iterator) {
    }
    return { status: 'ok' };
  }
}
