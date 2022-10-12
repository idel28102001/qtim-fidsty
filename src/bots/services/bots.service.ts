import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindManyOptions, FindOneOptions, In, Repository } from 'typeorm';
import { BotEntity } from '../entities/bot.entity';
import { CreateBotDto } from '../dto/create.bot.dto';
import { SubscribersService } from '../../subscribers/services/subscribers.service';
import { TelegrafBotsInterface } from '../interfaces/telegraf-bots.interface';
import { SchedulerRegistry } from '@nestjs/schedule';
import { botStatus } from '../enums/bot.status.enum';
import { ChangeBotStatusDto } from '../dto/change.bot.status.dto';
import { MediaService } from '../../media/services/media.service';
import { BlockUserBotDto } from '../dto/block-user.bot.dto';
import { EditAboutBotDto } from '../dto/edit-about.bot.dto';
import { TelegramService } from '../../telegram/services/telegram.service';
import { Api, TelegramClient } from 'telegram';
import { editBotByCommandInterface } from '../interfaces/edit-bot-by-command.interface';
import { UsersCenterService } from '../../users-center/users-center.service';
import { UserEntity } from '../../users-center/entities/user.entity';
import { TelegramBotService } from '../../telegram/services/telegram-bot.service';
import * as util from 'util';
import { UserPayloadInterface } from '../../users-center/interfaces/user.payload.interface';
import { NewMessage } from 'telegram/events';
import { TypeOfGettingEnum } from '../enums/type-of-getting.enum';
import { DiffTypePostsService } from '../../posts/services/posts/diff-type-posts.service';
import { TypeOfPostsEnum } from '../../posts/enums/type-of-posts.enum';
import { EventBuilder } from 'telegram/events/common';
import { getMockImage } from '../../utils/file-upload.utils';
import { UpdateConnectionState } from 'telegram/network';
import { UserCenterTokensEnum } from '../../users-center/enum/users-center-tokens.enum';
import { TelegramTokensEnum } from '../../telegram/enum/telegram-tokens.enum';
import { SubscribersTokensEnum } from '../../subscribers/enums/subscribers-tokens.enum';
import { DiffTypePostsTokensEnum } from '../../posts/enums/tokens/diff-type-posts.tokens.enum';
import { MediaTokensEnum } from '../../media/enums/tokens/media.tokens.enum';
import { BotsTokenEnum } from '../enums/tokens/bots.token.enum';

@Injectable()
export class BotsService {
  private botFather = '@BotFather';
  private telegrafBots: TelegrafBotsInterface[] = [];
  private pause = util.promisify((a, f) => setTimeout(f, a));
  private adminToken = process.env.ADMIN_TOKEN;
  private adminChannelId = process.env.ADMIN_CHANNEL_ID;

  constructor(
    @Inject(BotsTokenEnum.BOTS_REPOSITORY_TOKEN)
    private readonly botRepo: Repository<BotEntity>,
    @Inject(SubscribersTokensEnum.SUBSCRIBERS_SERVICE_TOKEN)
    private readonly subscriberService: SubscribersService,
    @Inject(UserCenterTokensEnum.USER_CENTER_SERVICE_TOKEN)
    private readonly usersCenterService: UsersCenterService,
    @Inject(TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN)
    private readonly telegramService: TelegramService,
    @Inject(TelegramTokensEnum.TELEGRAM_BOT_SERVICE_TOKEN)
    private readonly telegramBotsService: TelegramBotService,
    private schedulerRegistry: SchedulerRegistry,
    @Inject(MediaTokensEnum.MEDIA_SERVICE_TOKEN)
    private readonly mediaService: MediaService,
    @Inject(DiffTypePostsTokensEnum.DIFFTYPEPOSTS_SERVICE_TOKEN)
    private readonly diffTypePostsService: DiffTypePostsService,
  ) {
    (async (activate) => {
      const bots = await this.botRepo.find({
        select: ['token', 'id', 'botSession'],
      });
      for (const bot of bots) {
        try {
          await activate(bot.botSession);
        } catch (e) {
          throw new BadRequestException('Слишком много попыток.');
        }
      }
    })(this.telegrafBotActivate);
  }
  async addByUsername(userPayload: UserPayloadInterface, username: string) {
    const { sessionHash } = await this.usersCenterService.repo
      .createQueryBuilder('user')
      .where('user.id=:id', { id: Number(userPayload.userId) })
      .select('user.sessionHash')
      .getOne();
    username = username.startsWith('@') ? username : `@${username}`;
    const client = await this.telegramService.getTelegramClient(sessionHash);
    const allusernames = await this.getBotUsernames(client);
    if (!allusernames.map((e) => e.username).includes(username)) {
      throw new BadRequestException(
        'Такого бота нет в распоряжении у пользователя',
      );
    }
    const token = await this.getTokenByUsername(username, client);
    return await this.addBot(userPayload, token);
  }

  async checkBotOnUser(userPayload: UserPayloadInterface, channelId: number) {
    try {
      await this.botRepo
        .createQueryBuilder('bot')
        .innerJoin('bot.owner', 'owner', 'owner.id=:id', {
          id: userPayload.userId,
        })
        .where('bot.id=:channelId', { channelId })
        .getOneOrFail();
    } catch (e) {
      throw new NotFoundException('Такого бота у пользователя нет');
    }
  }

  get repo() {
    return this.botRepo;
  }

  async getBotById(botId: number) {
    const bot = await this.botRepo
      .createQueryBuilder('bot')
      .where('bot.id=:botId', { botId })
      .getOne();
    const client = await this.telegramBotsService.getTelegramBot(
      bot.botSession,
    );
    const botEntity = (await client.getMe()) as any;
    const photo = await this.telegramService.downloadPhoto(client, botEntity);
    return {
      id: bot.id,
      createdAt: bot.createdAt,
      name: bot.name,
      description: bot.description,
      primaryBot: bot.primaryBot,
      welcomeMessage: bot.welcomeMessage,
      username: bot.username,
      link: `https://t.me/${bot.username}`,
      photo,
    };
  }

  inBlackList(blacklist, sub) {
    return blacklist.map((e) => e.id).includes(sub.id);
  }

  startCommand(botClient, token: string) {
    // return async (e) => {
    //   const userId = e?.message?.peerId?.userId;
    //   if (!userId) return;
    //   const bot = await this.botRepo.findOne({
    //     relations: ['subscribers', 'blacklist', 'welcomeMessageFile'],
    //     select: ['id', 'welcomeMessage'],
    //     where: { token },
    //   });
    //   const sub = await this.subscriberService.createSubscriber(
    //     userId,
    //     botClient,
    //   );
    //   if (this.inBlackList(bot.blacklist, sub)) return;
    //
    //   const groups = (e.originalUpdate.message as any).patternMatch.groups;
    //   if (groups.label) {
    //     switch (groups.label) {
    //       case 'post': {
    //         const id = groups.id;
    //         await this.postsBotService.sendWholeMessage(id, userId, botClient);
    //         break;
    //       }
    //     }
    //     return;
    //   }
    //
    //   if (!bot.subscribers.map((e) => e.id).includes(sub.id)) {
    //     bot.subscribers.push(sub);
    //     await this.botRepo.save(bot);
    //   }
    //   let welcFile;
    //   if (bot.welcomeMessageFile) {
    //     welcFile = this.telegramService.downloadFile(bot.welcomeMessageFile);
    //   }
    //   const message = bot.welcomeMessage || 'Приветствую';
    //   if (welcFile) {
    //     await botClient.sendFile(userId, {
    //       file: welcFile,
    //       caption: message,
    //       parseMode: 'html',
    //     });
    //   } else {
    //     await botClient.sendMessage(userId, {
    //       message: message,
    //       parseMode: 'html',
    //     });
    //   }
    // };
  }

  async save(elems) {
    return await this.botRepo.save(elems);
  }

  async checkBotStatus(status): Promise<void> {
    if (status === botStatus.DEACTIVATED) {
      throw new BadRequestException('Bot is deactivated');
    }
  }

  async findBotByIdWithOpts(
    id: number,
    options?: FindOneOptions<BotEntity>,
  ): Promise<BotEntity> {
    try {
      return await this.botRepo.findOneOrFail({
        ...{ where: { id } },
        ...options,
      });
    } catch (e) {
      throw new NotFoundException('Bot not found');
    }
  }

  async findById(id: string | number) {
    return await this.botRepo
      .createQueryBuilder('bots')
      .where('bots.id=:id', { id })
      .select(['bots.id', 'bots.botSession'])
      .getOne();
  }

  async findBotById(id: number, options?: FindOneOptions<BotEntity>) {
    try {
      return this.botRepo.findOneOrFail({ ...{ where: { id } }, ...options });
    } catch (e) {
      throw new BadRequestException('Bot not found');
    }
  }

  async findBotByToken(
    token: string,
    options?: FindOneOptions<BotEntity>,
  ): Promise<BotEntity> {
    return this.botRepo.findOne({ ...{ where: { token } }, ...options });
  }

  async findBotByIds(
    ids: number[],
    options?: FindManyOptions<BotEntity>,
  ): Promise<BotEntity[]> {
    return this.botRepo.find({ ...{ where: { id: In(ids) } }, ...options });
  }

  async findBotByUsername(username: string): Promise<BotEntity> {
    try {
      return await this.botRepo.findOne({
        where: { username: username + '_bot' },
      });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async getBotsForAdmin(): Promise<BotEntity[]> {
    return await this.botRepo.find({ relations: ['owner', 'subscribers'] });
  }

  async find(options?: FindManyOptions<BotEntity>) {
    return await this.botRepo.find(options);
  }

  async sendMessageToBot(userPayload: UserPayloadInterface) {
    //   const user = await this.usersCenterService.findOneByIdWithOpts(
    //     userPayload.userId,
    //   );
    //   const client = await this.telegramService.getTelegramClient(
    //     user.sessionHash,
    //   );
    //   await client.addEventHandler(
    //     this.newMess.bind(null, client),
    //     new NewMessage({}),
    //   );
    //   await client.sendMessage(this.botFather, { message: '/token' });
  }

  async removeBot(id: number) {
    const bot = await this.botRepo.findOne({
      where: { id },
      select: ['username'],
    });
    const adminClient = await this.telegramService.getTelegramClient(
      this.adminToken,
    );
    await this.telegramService.kickOut(
      bot.username,
      process.env.ADMIN_CHANNEL_ID,
      adminClient,
    );
    return await this.botRepo.delete(id);
  }

  async addBot(userPayload: UserPayloadInterface, token: string) {
    const botIfExists = await this.botRepo.findOne({
      where: { token: token },
    });
    const user = await this.usersCenterService.findOneByIdWithOpts(
      userPayload.userId,
      { select: ['id'] },
    );
    let botSession;
    if (!botIfExists) {
      botSession = await this.telegramBotsService.registerTelegramBot(token);
    } else {
      botSession = botIfExists.botSession;
    }
    const botClient = await this.telegramService.getTelegramClient(botSession);
    const result = (await botClient.getMe()) as any;
    const createBotEntity = this.botRepo.create({
      botSession,
      username: result.username,
      token,
      owner: user,
      name: result.firstName,
      referralLink: `https://t.me/${result.username}`,
    });
    await this.telegramService.addAdmin(this.adminToken, result.username);
    if (botIfExists) {
      botIfExists.username = result.username;
      botIfExists.owner = user;
      botIfExists.name = result.firstName;
      return await this.botRepo.save(botIfExists);
    }
    const resultE = await this.botRepo.save(createBotEntity);
    return resultE;
  }

  async getBotUsernames(client: TelegramClient) {
    await client.sendMessage(this.botFather, { message: '/token' });
    const pauseTime = 50;
    let text = '';
    const allBots = [];
    while (text !== 'Choose a bot to generate a new token.') {
      const lastMessage = await client.getMessages(this.botFather, {
        limit: 1,
        fromUser: null,
      });
      await this.pause(pauseTime);
      const mess = lastMessage[0] as any;
      text = mess?.message;
      if (text === 'Choose a bot to generate a new token.') {
        mess.replyMarkup.rows.forEach((elem) => {
          allBots.push(...elem.buttons.map((e) => e.text));
        });
      }
    }
    return allBots.map((e) => {
      return { id: null, username: e };
    });
  }

  async getBotsForOwners(userPayload: UserPayloadInterface) {
    const { sessionHash } = await this.usersCenterService.findOneByIdWithOpts(
      userPayload.userId,
      { select: ['sessionHash'] },
    );
    const bots = await this.botRepo
      .createQueryBuilder('B')
      .innerJoin('B.owner', 'owner', 'owner.id=:userId', {
        userId: Number(userPayload.userId),
      })
      .orderBy('B.id', 'DESC')
      .select(['B.id', 'B.username', 'B.name'])
      .getMany();
    const client = await this.telegramService.getTelegramClient(sessionHash);
    const botUsernames = (await this.getBotUsernames(client)) as any;
    botUsernames.forEach((e) => {
      if (!bots.map((e) => `@${e.username}`).includes(e.username)) {
        bots.push(e);
      }
    });
    // const result = [];
    // const resultTokens = allBots.filter(
    //   (e) => !user.bots.map((e) => e.username).includes(e.slice(1)),
    // );
    // for (const username of resultTokens) {
    //   result.push({
    //     token: await this.getTokenByUsername(username, client),
    //     username: username.slice(1),
    //   });
    // }
    // const notInBase = result.map((e) => {
    //   return { id: null, ...e };
    // });
    const rest = await Promise.all(
      bots.map(async (e) => {
        const ent = (await client.getEntity(e.username)) as any;
        const photo = await this.telegramService.downloadPhoto(client, ent);
        const username = e.username.startsWith('@')
          ? e.username
          : `@${e.username}`;
        return {
          id: e.id,
          name: ent.firstName,
          username,
          photo: photo || getMockImage(),
        };
      }),
    );
    await client.disconnect();
    return rest;
  }

  async getTokenByUsername(username: string, client: TelegramClient) {
    const pauseTime = 50;
    let text = '';
    while (text !== 'Choose a bot to generate a new token.') {
      const lastMessage = await client.getMessages(this.botFather, {
        limit: 1,
        fromUser: null,
      });
      await this.pause(pauseTime);
      const mess = lastMessage[0] as any;
      text = mess?.message;
      if ('Choose a bot to generate a new token.') {
        await client.sendMessage(this.botFather, { message: username });
        let newText = '';
        while (
          !newText?.startsWith('You can use this token to access HTTP API:')
        ) {
          const lastMessage = await client.getMessages(this.botFather, {
            limit: 1,
            fromUser: null,
          });
          await this.pause(pauseTime);
          const mess = lastMessage[0] as any;
          newText = mess?.message;
          if (
            newText.startsWith('You can use this token to access HTTP API:')
          ) {
            const entity = mess.entities.find(
              (e) => e.className === 'MessageEntityCode',
            );
            const idx = entity.offset;
            const length = entity.length;
            return mess.message.slice(idx, idx + length);
          }
        }
      }
    }
  }

  async getBotsForManagers(user): Promise<BotEntity[]> {
    return await this.usersCenterService.getBotsForManagers(user);
  }

  async changeBotStatus(
    id: number,
    data: ChangeBotStatusDto,
  ): Promise<BotEntity> {
    const bot = await this.findBotByIdWithOpts(id, {
      select: ['id', 'status'],
    });
    try {
      bot.status = data.status;
      return await this.botRepo.save(bot);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async editBotAbout(id: number, data: EditAboutBotDto) {
    const bot = await this.botRepo.findOne({
      where: { id },
      relations: ['owner'],
    });
    const sessionHash = bot.owner.sessionHash;
    const client = await this.telegramService.getTelegramClient(sessionHash);
    await client.connect();
    await client.sendMessage(this.botFather, { message: '/setabouttext' });
    await client.sendMessage(this.botFather, { message: `@${bot.username}` });
    await client.sendMessage(this.botFather, { message: data.about });
  }

  async changePrimaryBot(id: number): Promise<BotEntity> {
    const primaryBot = await this.findBotByIdWithOpts(id, {
      select: ['id'],
      relations: ['owner.bots', 'owner'],
    });
    const owner = primaryBot.owner;
    owner.bots.map((e) => {
      e.primaryBot = e.id === id;
    });
    return (await this.usersCenterService.save(owner)).bots.find(
      (e) => e.id === id,
    );
  }

  async timeOutCall(func: any, ms: number) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        resolve(func);
      }, ms);
    }).then((data) => {
      return data;
    });
  }

  async addWelcomeMessageFile(id: number, user: UserPayloadInterface, file) {
    const bot = await this.findBotByIdWithOpts(id, {
      select: ['botSession', 'id'],
      relations: ['welcomeMessageFile'],
    });
    const botClient = await this.telegramBotsService.getTelegramBot(
      bot.botSession,
    );
    // const we = bot.welcomeMessageFile;
    // if (we && file) {
    //   await this.mediaService.deleteById(we.id);
    // }
    //
    // bot.welcomeMessageFile = await this.mediaService.createTelegramMedia(
    //   file,
    //   botClient,
    // );
    try {
      return await this.botRepo.save(bot);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  // async messageSchedule(post: OneOffPostsEntity): Promise<void> {
  //   const taskName = `sendMessageTask${post.id}`;
  //   const sendMessageTask = async () => {
  //     try {
  //       await this.sendMessage(post.id);
  //     } catch (e) {
  //       throw new BadRequestException(e);
  //     }
  //     this.schedulerRegistry.deleteCronJob(taskName);
  //   };
  //
  //   const publishDate = add(new Date(), {
  //     seconds: 3,
  //   });
  //
  //   try {
  //     const botSendMessageJob = new CronJob(publishDate, sendMessageTask);
  //     this.schedulerRegistry.addCronJob(taskName, botSendMessageJob);
  //     botSendMessageJob.start();
  //   } catch (e) {
  //     throw new BadRequestException(e);
  //   }
  // }

  // async messageReschedule(post: OneOffPostsEntity): Promise<void> {
  //   const taskName = `sendMessageTask${post.id}`;
  //   try {
  //     this.schedulerRegistry.getCronJob(taskName);
  //     this.schedulerRegistry.deleteCronJob(taskName);
  //     await this.messageSchedule(post);
  //   } catch (e) {
  //     await this.messageSchedule(post);
  //   }
  // }

  // async sendMessage(id: number): Promise<void> {
  //   const post = await this.postsBotService.findOneByIdWithOpts(id, {
  //     relations: ['bot', 'content', 'content.preview'],
  //     select: ['id'],
  //   });
  //   const botClient = await this.telegramBotsService.getTelegramBot(
  //     post.bot.botSession,
  //   );
  //   await botClient.addEventHandler(
  //     this.postsBotService.callbackData(botClient),
  //     new CallbackQuery({}),
  //   );
  //   const bot = await this.findBotByIdWithOpts(post.bot.id, {
  //     select: ['status', 'token'],
  //     relations: ['subscribers'],
  //   });
  //   await this.checkBotStatus(bot.status);
  //
  //   if (bot.subscribers && !bot.subscribers.length) {
  //     throw new NotFoundException('Bot subscribers empty');
  //   }
  //   const messagePreview = this.telegramBotsService.makePreviewText(
  //     post.content.preview.title,
  //     post.content.preview.description,
  //   );
  //   await this.telegramBotsService.sendMedia(
  //     post.content.preview.attachedfiles,
  //     botClient,
  //     messagePreview,
  //     id,
  //     bot.subscribers,
  //   );
  // }

  async addManagerToBot(botId: number, user: UserEntity): Promise<BotEntity> {
    const bot = await this.findBotByIdWithOpts(botId, {
      select: ['id'],
      relations: ['managers'],
    });
    try {
      return await this.botRepo.save({
        ...bot,
        managers: [...bot.managers, user],
      });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async getLastMessage(client: TelegramClient) {
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    const someFunc = () => {
      return {
        get: () =>
          delay(100)
            .then(() =>
              client.getMessages(this.botFather, {
                limit: 6,
              }),
            )
            .then((e) => {
              const lastId = e[0].id;
              return e.find((currE) => !currE.fromId && currE.id === lastId);
            }),
      };
    };
    const delayFunc = someFunc();

    const iterator = {
      [Symbol.asyncIterator]: () => {
        let done = false;
        return {
          next: async () => {
            const elem = await delayFunc.get();
            if (elem && !done) {
              done = true;
              return { done: false, value: elem };
            }
            return { done: true };
          },
        };
      },
    };
    for await (const iter of iterator) {
      if (iter) {
        return { message: iter.message, entities: iter.entities };
      }
    }
  }

  async createBot(
    data: CreateBotDto,
    user: UserPayloadInterface,
    file?,
  ): Promise<any> {
    const owner = await this.usersCenterService.findOneByIdWithOpts(
      user.userId,
      {
        select: ['id', 'bots', 'sessionHash'],
        relations: ['bots', 'bots.managers'],
      },
    );
    const client = await this.telegramService.getTelegramClient(
      owner.sessionHash,
    );
    try {
      const botFather = await client.getEntity(this.botFather);
      await client.sendMessage(botFather, { message: '/start' });
    } catch (e) {
      throw new BadRequestException(
        'BotFather connection failed, please start conversation with it https://telegram.me/BotFather',
      );
    }
    const message = await this.createBotWithUsername(
      data.name,
      data.username,
      client,
    );
    const result = await this.getLastMessage(client);

    await this.tooManyAttempts(client);

    if (
      result.message ===
      'Sorry, this username is already taken. Please try something different.'
    ) {
      throw new NotFoundException('Bot is exists');
    }
    try {
      const entity = result.entities.find(
        (e) => e.className === 'MessageEntityCode',
      );
      const idx = entity.offset;
      const length = entity.length;
      const token = result.message.slice(idx, idx + length);
      const botSession = await this.telegramBotsService.registerTelegramBot(
        token,
      );
      const botClient = await this.telegramBotsService.getTelegramBot(
        botSession,
      );
      const botInfo = (await botClient.getMe()) as any;
      const managers = owner.bots.length && owner.bots[0].managers;
      const bot = this.botRepo.create({
        token: token,
        name: botInfo.firstName,
        username: botInfo.username,
        owner,
        botSession,
        referralLink: `t.me/${botInfo.username}`,
        managers,
      });
      if (this.adminChannelId && this.adminToken) {
        await this.telegramService.addAdmin(this.adminToken, bot.username);
      }
      const editData = {
        description: data.description || '',
        file,
      };
      const botE = await this.editBotOnline(bot, editData, client);
      botE.welcomeMessage = data.welcomeMessage;
      botE.owner = owner;
      const newBot = await this.botRepo.save(botE);
      await this.telegrafBotActivate(botSession);
      await client.sendMessage(data.username + '_bot', { message: '/start' });
      return newBot;
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async editBotName(username: string, message: string, client: TelegramClient) {
    await this.editBotByCommand(
      { username, message, command: '/setname' },
      client,
    );
  }

  async editBotDescription(
    username: string,
    message: string,
    client: TelegramClient,
  ) {
    await this.editBotByCommand(
      { username, message, command: '/setdescription' },
      client,
    );
  }

  async createBotWithUsername(
    username: string,
    usernameBot: string,
    client: TelegramClient,
  ) {
    return await this.editBotByCommand(
      { username, message: usernameBot + '_bot', command: '/newbot' },
      client,
    );
  }

  async editBotProfilePhoto(
    username: string,
    file: any,
    client: TelegramClient,
  ) {
    await this.editBotByCommand(
      { username, file, command: '/setuserpic' },
      client,
    );
  }

  async deleteBotByCommand(username: string, client: TelegramClient) {
    await this.editBotByCommand(
      { username, message: 'Yes, I am totally sure.', command: '/deletebot' },
      client,
    );
  }

  async tooManyAttempts(client) {
    const text = await this.getLastMessage(client);
    const result = text.message.match(
      /Sorry, too many attempts. Please try again in (\d+?) seconds./,
    );
    if (result) throw new BadRequestException(text);
    else return result;
  }

  async editBotByCommand(
    data: editBotByCommandInterface,
    client: TelegramClient,
  ) {
    await this.timeOutCall(
      client.sendMessage(this.botFather, { message: data.command }),
      2000,
    );
    await this.tooManyAttempts(client);

    await this.timeOutCall(
      client.sendMessage(this.botFather, { message: data.username }),
      2000,
    );
    await this.tooManyAttempts(client);
    if (data.message) {
      return await this.timeOutCall(
        client.sendMessage(this.botFather, { message: data.message }),
        2000,
      );
    }
    if (data.file) {
      return await this.timeOutCall(
        client.sendFile(this.botFather, {
          file: data.file,
        }),
        2000,
      );
    }
  }

  async editBot(id: number, data, user: UserPayloadInterface, file) {
    const bot = await this.botRepo.findOne({
      where: { id },
      select: ['id', 'username', 'description', 'welcomeMessage'],
    });
    const { sessionHash } = await this.usersCenterService.findOneByIdWithOpts(
      user.userId,
    );
    const client = await this.telegramService.getTelegramClient(sessionHash);
    const newBot = await this.editBotOnline(bot, { file, ...data }, client);
    if (data.welcomeMessage) {
      newBot.welcomeMessage = data.welcomeMessage;
    }
    return await this.botRepo.save(newBot);
  }

  async editBotOnline(
    bot: BotEntity,
    data: any,
    client: TelegramClient,
  ): Promise<BotEntity> {
    const botUsername = `@${bot.username}`;
    if (data.name) {
      await this.editBotName(botUsername, data.name, client);
      bot.name = data.name;
    }
    if (data.description) {
      await this.editBotDescription(botUsername, data.description, client);
      bot.description = data.description;
    }
    if (data.file) {
      try {
        const uploadedFile = await this.mediaService.uploadPhoto(
          data.file,
          client,
        );
        await this.editBotProfilePhoto(botUsername, uploadedFile, client);
      } catch (e) {
        throw new BadRequestException(e);
      }
    }
    return bot;
  }

  async deleteBot(user: UserPayloadInterface, id: number) {
    const bot = await this.findBotByIdWithOpts(id, {
      select: ['id', 'username', 'token'],
      relations: ['managers', 'subscribers'],
    });
    const botUsername = `@${bot.username}`;
    const owner = await this.usersCenterService.findOneByIdWithOpts(
      user.userId,
      {
        select: ['bots', 'id', 'sessionHash'],
        relations: ['bots', 'bots.managers'],
      },
    );
    const client = await this.telegramService.getTelegramClient(
      owner.sessionHash,
    );
    await this.deleteBotByCommand(botUsername, client);
    return await this.botRepo.remove(bot);
  }

  async getSubscribersByBot(id: number) {
    const bot = await this.botRepo.findOne({
      where: { id },
      relations: ['subscribers'],
      select: ['id'],
    });
    return bot.subscribers;
  }

  async blockSub(id: number, data: BlockUserBotDto) {
    const sub = await this.subscriberService.findByIdWithOpts(data.userId, {
      select: ['id'],
      relations: ['blacklist', 'bots'],
    });
    const bot = await this.botRepo.findOne({
      where: { id },
      select: ['id'],
      relations: ['blacklist', 'subscribers'],
    });
    bot.subscribers = bot.subscribers.filter((e) => e.id !== sub.id);
    if (!bot.blacklist.map((e) => e.id).includes(sub.id)) {
      bot.blacklist.push(sub);
    }
    await this.botRepo.save(bot);
    return true;
  }

  async unblockSub(id: number, data: BlockUserBotDto) {
    const sub = await this.subscriberService.findByIdWithOpts(data.userId, {
      select: ['id'],
      relations: ['blacklist', 'bots'],
    });
    const bot = await this.botRepo.findOne({
      where: { id },
      select: ['id'],
      relations: ['blacklist', 'subscribers'],
    });
    bot.blacklist = bot.blacklist.filter((e) => e.id !== sub.id);
    if (!bot.subscribers.map((e) => e.id).includes(sub.id)) {
      bot.subscribers.push(sub);
    }
    await this.botRepo.save(bot);
    return true;
  }

  getPost(client: TelegramClient) {
    return async (elem) => {
      const groups = elem.message.patternMatch.groups;
      groups.type = Number(groups.type);
      const { type, id } = groups;
      const userId = elem.message.peerId.userId;
      const botEnt = (await client.getMe()) as any;
      await this.subscriberService.getOrCreateSub(userId.toString(), client);
      switch (type) {
        case TypeOfGettingEnum.ONETIMEPOSTS: {
          const user = await this.subscriberService.repo
            .createQueryBuilder('subs')
            .innerJoin('subs.posts', 'posts', 'posts.id=:id', { id })
            .innerJoin('posts.bot', 'bot', `bot.username=:username`, {
              username: botEnt.username,
            })
            .andWhere(`subs.telegramId=:userId`, { userId })
            .select(['subs.id'])
            .getOne();
          if (user) {
            await this.diffTypePostsService.sendWholeMessage(
              userId,
              id,
              client,
            );
          } else {
            const post = await this.diffTypePostsService.repo
              .createQueryBuilder('posts')
              .where('posts.id=:id', { id })
              .andWhere('posts.type=:type', {
                type: TypeOfPostsEnum.ONETIMEPOSTS,
              })
              .innerJoin('posts.bot', 'bot', `bot.username=:username`, {
                username: botEnt.username,
              })
              .select('posts.id')
              .getOne();
            if (post) {
              await this.diffTypePostsService.sendPreview(userId, id, client);
            } else {
              await client.sendMessage(userId, { message: `Поста №${id} нет` });
            }
          }
          break;
        }
        default: {
          await client.sendMessage(userId, { message: `Поста №${id} нет` });
          break;
        }
      }
    };
  }

  buyPost(botClient: TelegramClient) {
    return async (elem) => {
      if (elem.className !== 'UpdateBotCallbackQuery') return;
      const userId = elem.peer.userId;
      const data = JSON.parse(elem.data.toString());
      await botClient.invoke(
        new Api.messages.DeleteMessages({ revoke: true, id: [elem.msgId] }),
      );
      switch (data.type) {
        case TypeOfPostsEnum.ONETIMEPOSTS: {
          await this.addPostToSub(userId, data.id, botClient);
          await this.diffTypePostsService.sendWholeMessage(
            userId,
            data.id,
            botClient,
          );
          break;
        }
        case 'delete': {
          break;
        }
      }
    };
  }

  async addPostToSub(userId, id: number, botClient: TelegramClient) {
    const subscriber = await this.subscriberService.repo
      .createQueryBuilder('subs')
      .where(`subs.telegramId=:userId`, { userId })
      .leftJoin('subs.posts', 'posts')
      .select(['subs.id', 'posts.id'])
      .getOne();
    if (!subscriber.posts.find((e) => e.id === id)) {
      await botClient.sendMessage(userId, {
        message: `Вы купили пост номер №${id}`,
      });
      const post = await this.diffTypePostsService.repo.findOne({
        where: { id },
        select: ['id'],
      });
      subscriber.posts.push(post);
      await this.subscriberService.repo.save(subscriber);
    }
  }

  reconnect(botClient) {
    return async (elems) => {
      if (elems instanceof UpdateConnectionState) {
        if (elems.state === -1) {
          await botClient.connect();
        }
      }
    };
  }

  async addGetPostEvent(botClient: TelegramClient) {
    await botClient.addEventHandler(
      this.reconnect(botClient),
      new EventBuilder({}),
    );

    await botClient.addEventHandler(
      this.buyPost(botClient),
      new EventBuilder({}),
    );

    await botClient.addEventHandler(
      this.getPost(botClient),
      new NewMessage({
        pattern: /^\/start (type-(?<type>\d+?))(id-(?<id>\d+?))$/,
      }),
    );
  }

  private telegrafBotActivate = async (botSession: string) => {
    const botClient = await this.telegramBotsService.getTelegramBot(botSession);
    await this.addGetPostEvent(botClient);
    await botClient.disconnect();
  };
}
