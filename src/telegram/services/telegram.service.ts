import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { CreateChannelDto } from '../../channels/dto/create-channel.dto';
import * as BigInt from 'big-integer';
import { AuthEnum } from '../../auth/enums/auth.enum';
import { CustomFile } from 'telegram/client/uploads';
import { MoreThan } from 'typeorm';
import * as crypto from 'crypto';
import { getMonday } from '../../utils/time.utils';
import { SizesEnum } from '../../media/enums/sizesEnum';
import { MediaV3Entity } from '../../media/entities/media-v3.entity';
import { PhotoEntity } from '../../media/entities/media/photo/photo.entity';
import { DocumentEntity } from '../../media/entities/media/document/document.entity';
import { Entity } from 'telegram/define';
import { getMockImage } from '../../utils/file-upload.utils';

@Injectable()
export class TelegramService {
  async addAdmin(adminToken: string, username) {
    const adminClient = await this.getTelegramClient(adminToken);
    await this.allowToJoin(username, process.env.ADMIN_CHANNEL_ID, adminClient);
    await this.addAdminToChannel(
      process.env.ADMIN_CHANNEL_ID,
      username,
      adminClient,
    );
    await adminClient.disconnect();
  }

  prepareMediaToSend(
    location: Api.InputDocumentFileLocation | Api.InputPhotoFileLocation,
    mimeType: string,
  ) {
    if (location instanceof Api.InputPhotoFileLocation) {
      return new Api.InputMediaPhoto({
        id: new Api.InputPhoto({
          id: location.id,
          accessHash: location.accessHash,
          fileReference: location.fileReference,
        }),
      });
    } else if (location instanceof Api.InputDocumentFileLocation) {
      const [first, second] = mimeType.split('/');
      switch (first) {
        case 'video': {
          return new Api.InputMediaDocument({
            id: new Api.InputDocument({
              id: location.id,
              accessHash: location.accessHash,
              fileReference: location.fileReference,
            }),
          });
        }
      }
    }
  }

  getRightSize(sizes, size = SizesEnum.MIN) {
    switch (size) {
      case SizesEnum.MIN: {
        return sizes
          .filter((e) => e.type !== 'i')
          .sort((a, b) => {
            if (Number(a.size) < Number(b.size)) return -1;
            else if (Number(a.size) > Number(b.size)) return 1;
            return 0;
          })[0];
      }
      case SizesEnum.MAX: {
        return sizes
          .filter((e) => e.type !== 'i')
          .sort((a, b) => {
            if (Number(a.size) > Number(b.size)) return -1;
            else if (Number(a.size) < Number(b.size)) return 1;
            return 0;
          })[0];
      }

      case SizesEnum.MEDIUM: {
        const thumbSizes = sizes
          .filter((e) => e.type !== 'i')
          .sort((a, b) => {
            if (Number(a.size) > Number(b.size)) return -1;
            else if (Number(a.size) < Number(b.size)) return 1;
            return 0;
          });
        const length = Math.floor(thumbSizes.length / 2);
        const curr = thumbSizes[length];
        return thumbSizes[length];
      }
    }
  }

  prepareFileForDownload(
    file: PhotoEntity | DocumentEntity,
    sizes,
    size = SizesEnum.MIN,
  ) {
    const thumbSize = sizes?.length
      ? this.getRightSize(sizes, size)
      : { type: 's' };
    return {
      id: BigInt(file.telegramId.toString()),
      accessHash: BigInt(file.accessHash.toString()),
      fileReference: file.fileReference,
      thumbSize: thumbSize.type,
    };
  }

  getLocation(media: MediaV3Entity, size) {
    if (!media) return null;
    if (media.photo) {
      const photo = media.photo;
      const forLocation = this.prepareFileForDownload(photo, photo.sizes, size);
      const location = new Api.InputPhotoFileLocation(forLocation);
      const mimeType = photo.mimeType;
      return { location, mimeType };
    } else if (media.document) {
      const [first, second] = media.document.mimeType.split('/');
      switch (first) {
        case 'video': {
          const video = media.document;
          const forLocation = this.prepareFileForDownload(
            video,
            video.thumbs,
            size,
          );
          const location = new Api.InputDocumentFileLocation(forLocation);
          const mimeType = video.mimeType;
          return { location, mimeType };
        }
      }
    }
  }
  async downloadFileV2(
    media: MediaV3Entity,
    client: TelegramClient,
    size = SizesEnum.MIN,
  ) {
    if (!media) return null;
    const { location, mimeType } = this.getLocation(media, size);
    if (location) {
      const getFile = new Api.upload.GetFile({
        location,
        offset: BigInt(0),
        limit: 512 * 1024,
      });
      const file = (await client.invoke(getFile)) as any;
      return {
        id: media.id,
        mimeType,
        bytes: file.bytes.toString('base64'),
      };
    }
  }

  async downloadPhoto(client: TelegramClient, curr) {
    const user = await client.getInputEntity(curr);
    const photoEnt = (curr as any).photo;
    if (!photoEnt?.photoId) {
      return getMockImage().bytes;
    }
    const location = new Api.InputPeerPhotoFileLocation({
      big: false,
      peer: user,
      photoId: BigInt(photoEnt.photoId),
    } as any);
    const file = new Api.upload.GetFile({
      location,
      offset: BigInt(0),
      limit: 256 * 1024,
    });
    return ((await client.invoke(file)) as any).bytes.toString('base64');
  }
  async checkEntityExists(client, channelId) {
    const id = BigInt(channelId);
    try {
      const chan = await client.getEntity(id);
    } catch (e) {
      if (
        !e.toString().startsWith('Error: Could not find the input entity for')
      )
        throw new BadRequestException(e);
      else return;
    }
    throw new BadRequestException('Канал контроля уже существует');
  }

  async isExists(client: TelegramClient, id) {
    try {
      const chan = await client.getEntity(id);
    } catch (e) {
      if (e.toString().startsWith('Error: Could not find the input entity for'))
        return false;
      else throw new BadRequestException(e);
    }
    return true;
  }

  async kickOut(username: string, channelId: string, client: TelegramClient) {
    const getChannel = await client.getEntity(process.env.ADMIN_CHANNEL_ID);
    await client.invoke(
      new Api.channels.EditBanned({
        channel: getChannel,
        participant: username,
        bannedRights: new Api.ChatBannedRights({
          inviteUsers: true,
          pinMessages: true,
          changeInfo: true,
          embedLinks: true,
          sendGames: true,
          sendGifs: true,
          sendInline: true,
          sendMedia: true,
          sendMessages: true,
          sendPolls: true,
          sendStickers: true,
          viewMessages: true,
          untilDate: 1,
        }),
      }),
    );
  }

  async allowToJoin(
    username: string,
    channelId: string,
    client: TelegramClient,
  ) {
    const getChannel = await client.getEntity(channelId);
    await client.invoke(
      new Api.channels.EditBanned({
        channel: getChannel,
        participant: username,
        bannedRights: new Api.ChatBannedRights({
          inviteUsers: false,
          pinMessages: false,
          changeInfo: false,
          embedLinks: false,
          sendGames: false,
          sendGifs: false,
          sendInline: false,
          sendMedia: false,
          sendMessages: false,
          sendPolls: false,
          sendStickers: false,
          viewMessages: false,
          untilDate: 1,
        }),
      }),
    );
  }

  async addAdminToChannel(
    chanId: string,
    username: string,
    client: TelegramClient,
  ) {
    const chatId = await this.getChannelEntity(chanId, client);
    const userId = await client.getEntity(username);
    const adminRights = new Api.ChatAdminRights({
      changeInfo: true,
      other: true,
      banUsers: true,
      inviteUsers: true,
      deleteMessages: true,
      editMessages: true,
      postMessages: true,
      manageCall: true,
      pinMessages: true,
    });
    try {
      await client.invoke(
        new Api.channels.EditAdmin({
          channel: chatId,
          userId,
          adminRights,
          rank: 'mainAdmin',
        }),
      );
      await client.invoke(
        new Api.channels.InviteToChannel({
          channel: chatId,
          users: [userId],
        }),
      );
    } catch (e) {
      if (e.errorMessage !== 'USER_BOT') {
        throw new BadRequestException(e);
      }
    }
    return { status: 'ok' };
  }

  async uploadMedia(
    client: TelegramClient,
    fileMedia: Express.Multer.File,
    peer: Entity,
  ) {
    if (!fileMedia) return null;
    const file = await this.uploadFile(client, fileMedia);
    const media = this.getInputMedia(fileMedia, file);
    const uploadMediaEnt = new Api.messages.UploadMedia({ peer, media });
    return await client.invoke(uploadMediaEnt);
  }

  getInputMedia(fileMedia, file: Api.InputFile | Api.InputFileBig) {
    const [firstType, secondType] = fileMedia.mimetype.split('/');
    switch (firstType) {
      case 'image': {
        return new Api.InputMediaUploadedPhoto({
          file,
        });
        break;
      }
      case 'video': {
        return new Api.InputMediaUploadedDocument({
          file,
          mimeType: fileMedia.mimetype,
          attributes: [],
        });
        break;
      }
    }
  }

  async uploadFile(client: TelegramClient, media: Express.Multer.File) {
    const file = new CustomFile(
      media.originalname,
      media.size,
      media.originalname,
      media.buffer,
    );
    return await client.uploadFile({ file, workers: 1 });
  }

  makeChannelId(chanId: string) {
    return BigInt(this.returnChId(chanId));
  }

  returnChId(chanId: string) {
    if (chanId.startsWith('-100')) {
      return chanId;
    } else {
      return `${'-100'}${chanId}`;
    }
  }

  async getChannelEntity(chanId: string, client: TelegramClient) {
    const id = this.makeChannelId(chanId);
    // '-100ID' - Отвечает за каналы или за большие группы
    // '-ID' - отвечает за малые группы
    // 'ID' - отвечает за пользователей
    try {
      return await client.getEntity(id); // Создаём id канала
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async getEntity(currId: string | number, client: TelegramClient) {
    const idN = String(currId);
    const id = BigInt(idN);
    return await client.getEntity(id);
  }

  async getTelegramClient(session = '', auth = AuthEnum.NoAuth) {
    const apiId = Number(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH;
    const stringSession = new StringSession(session); // Создаём сессию
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      // Создаем клиента
      connectionRetries: 5,
    });
    await client.connect(); // Конектимся
    if (!(await client.checkAuthorization()) && !auth && session) {
      // Проверяем - действительна ли сессия
      throw new UnauthorizedException('Сессия недействительна');
    }
    return client; // Возвращаем
  }

  async createChannel(
    dto: CreateChannelDto,
    client: TelegramClient,
  ): Promise<Api.Updates> {
    const { title, about } = dto; // Для канала
    try {
      return (await client.invoke(
        new Api.channels.CreateChannel({ title, about }),
      )) as unknown as Api.Updates; // Создаём канал
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async getChannelByChannelId(channelId: string, telegramSession: string) {
    const { client, peer } = await this.preparePropertiesForChannel(
      channelId,
      telegramSession,
    ); // Для канала и клиента
    try {
      return await client.invoke(
        new Api.channels.GetFullChannel({ channel: peer }),
      ); // Возвращаем полные данные по каналу
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async getAllChannels(telegramSession: string, th) {
    const client = await this.getTelegramClient(telegramSession); // Получаем клиента
    const channels = ((await client.getDialogs({})) as any) // Получаем весь список диалогов
      .filter((dialog) => {
        return dialog.isChannel && dialog.entity.creator;
      });
    return await Promise.all(
      channels.map(async (currElem) => {
        const elem = await this.getInfoAboutChannel(currElem, client, th);
        return {
          photo: elem.photo,
          channel: currElem,
          total: elem.total,
          newSubs: elem.newSubs,
        };
      }),
    );
  }

  async getInfoAboutChannel(e, client, th) {
    const date = getMonday(new Date());
    const channelId = (e as any).inputEntity.channelId.toString();
    const newsubs = await th.newsubService.find({
      where: { channelId, createdAt: MoreThan(date) },
    });
    const all = await client.getParticipants((e as any).id, {
      limit: newsubs.length > 5 ? 5 : newsubs.length || 1,
    });
    const newSubs = { total: newsubs.length, last5: [] };
    if (newsubs.length) {
      newSubs.last5 = await Promise.all(
        all.map(async (e) => {
          e = e as any;
          const photo = await this.downloadPhoto(client, e);
          return {
            photo,
            username: `@${e.username}`,
            link: `t.me/${e.username}`,
          };
        }),
      );
    }
    return {
      photo: await this.downloadPhoto(client, e.entity),
      total: all.total,
      newSubs,
    };
  }

  async deleteChannel(channelId: string, telegramSession?: string) {
    const { client, peer } = await this.preparePropertiesForChannel(
      channelId,
      telegramSession,
    ); // Для канала и клиента
    try {
      return await client.invoke(
        new Api.channels.DeleteChannel({ channel: peer }),
      ); // Меняем заголовок
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async checkUsername(username: string, client: TelegramClient) {
    try {
      return await client.invoke(
        new Api.account.CheckUsername({ username: username }),
      );
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async checkUsernameForEditChannel(
    username: string,
    channelId: string,
    telegramSession: string,
  ) {
    const { client, peer } = await this.preparePropertiesForChannel(
      channelId,
      telegramSession,
    ); // Для канала и клиента
    try {
      return await client.invoke(
        new Api.channels.CheckUsername({ channel: peer, username: username }),
      );
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async channelEditUsername(
    username: string,
    channelId: string,
    client: TelegramClient,
  ) {
    const peer = await this.getChannelEntity(channelId, client); // Для канала и клиента
    try {
      return await client.invoke(
        new Api.channels.UpdateUsername({ channel: peer, username }),
      );
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async editProfilePhoto(client: TelegramClient, photoElem, channelElem) {
    const file = await this.uploadFile(client, photoElem);
    const photo = new Api.InputChatUploadedPhoto({ file });
    const channel = await client.getInputEntity(channelElem);
    return await client.invoke(new Api.channels.EditPhoto({ channel, photo }));
  }

  async uploadFileV2(client: TelegramClient, file) {
    const fileId = BigInt(crypto.randomInt(10 ** 7, 10 ** 8));
    const toSave = new Api.upload.SaveFilePart({
      fileId,
      filePart: 1,
      bytes: file.buffer,
    });
    await client.invoke(toSave);
    return new Api.InputFile({
      id: fileId,
      parts: 1,
      name: file.originalname,
      md5Checksum: '',
    });
  }

  async editTitle(title: string, channelId: string, telegramSession: string) {
    const { client, peer } = await this.preparePropertiesForChannel(
      channelId,
      telegramSession,
    ); // Для канала и клиента
    try {
      return await client.invoke(
        new Api.channels.EditTitle({ channel: peer, title }),
      ); // Меняем заголовок
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async editAbout(about: string, channelId: string, telegramSession: string) {
    const { client, peer } = await this.preparePropertiesForChannel(
      channelId,
      telegramSession,
    ); // Для канала и клиента
    try {
      return await client.invoke(
        new Api.messages.EditChatAbout({ peer, about }),
      ); // Меняем заголовок
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async preparePropertiesForChannel(chId: string, telegramSession: string) {
    // Подготовим клиент и сам "ссылку" на канал
    const client = await this.getTelegramClient(telegramSession); // Получаем клиента
    const peer = await this.getChannelEntity(chId, client); // Получаем ссылку
    return { client, peer }; // Возвращаем
  }
}
