import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DeleteResult, Repository } from 'typeorm';
import { MediaEntity } from '../entities/media.entity';
import { TelegramService } from '../../telegram/services/telegram.service';
import { CustomFile } from 'telegram/client/uploads';
import { Api, TelegramClient } from 'telegram';
import { PhotoService } from './photo.service';
import { DocumentService } from './document.service';
import { PhotoEntity } from '../entities/media/photo/photo.entity';
import { DocumentEntity } from '../entities/media/document/document.entity';
import { Mediav3Service } from './mediav3.service';
import { TelegramTokensEnum } from '../../telegram/enum/telegram-tokens.enum';
import { MediaTokensEnum } from '../enums/tokens/media.tokens.enum';
import { MediaV3TokensEnum } from '../enums/tokens/media-v3.tokens.enum';
import { PhotoTokensEnum } from '../enums/tokens/photo.tokens.enum';
import { DocumentTokensEnum } from '../enums/tokens/document.tokens.enum';

@Injectable()
export class MediaService {
  constructor(
    @Inject(MediaTokensEnum.MEDIA_REPOSITORY_TOKEN)
    private readonly mediaRepo: Repository<MediaEntity>,
    @Inject(MediaV3TokensEnum.MEDIA_V3_SERVICE_TOKEN)
    private readonly mediaV3Service: Mediav3Service,
    @Inject(TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN)
    private readonly telegramService: TelegramService,
    @Inject(PhotoTokensEnum.PHOTO_SERVICE_TOKEN)
    private readonly photoService: PhotoService,
    @Inject(DocumentTokensEnum.DOCUMENT_SERVICE_TOKEN)
    private readonly documentService: DocumentService,
  ) {}

  async prepareOneTypeMessage(
    client: TelegramClient,
    channelId: string,
    files: Express.Multer.File[] = [],
  ) {
    let peer;
    try {
      peer = await this.telegramService.getChannelEntity(channelId, client);
    } catch (e) {
      const ent = (await client.getMe()) as any;
      await this.telegramService.addAdmin(
        process.env.ADMIN_TOKEN,
        ent.username,
      );
      peer = await this.telegramService.getChannelEntity(channelId, client);
    }
    const attached: Array<PhotoEntity | DocumentEntity> = [];
    for (const file of files || []) {
      const tgFile = await this.telegramService.uploadMedia(client, file, peer);
      const resultMessage = await this.messageMedia(tgFile, file);
      attached.push(resultMessage);
    }
    return await Promise.all(
      attached.map(async (e) => {
        return await this.createMediaV3(e);
      }),
    );
  }

  async findMediaById(id: number): Promise<MediaEntity> {
    try {
      return await this.mediaRepo.findOne({ where: { id } });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async uploadPhoto(file: Express.Multer.File, client: TelegramClient) {
    const toUpload = new CustomFile(
      file.originalname,
      file.size,
      file.originalname,
      file.buffer,
    );
    return await client.uploadFile({
      file: toUpload,
      workers: 1,
    });
  }

  async createDataMedia(media): Promise<MediaEntity> {
    return await this.mediaRepo.save({
      name: media.filename,
      url: `/api/image/${media.filename}`,
      mediaType: media.mimetype,
    });
  }

  async messageMedia(media: Api.TypeMessageMedia, file: Express.Multer.File) {
    switch (media.className) {
      case 'MessageMediaPhoto': {
        return await this.photoService.createEntity(media, file);
      }
      case 'MessageMediaDocument': {
        switch (media.document.className) {
          case 'Document': {
            return await this.documentService.createEntity(media);
          }
        }
      }
    }
  }

  async createMediaV3(media: PhotoEntity | DocumentEntity) {
    if (media instanceof PhotoEntity) {
      const med = this.mediaV3Service.repo.create({ photo: media });
      return await this.mediaV3Service.repo.save(med);
    } else if (media instanceof DocumentEntity) {
      const med = this.mediaV3Service.repo.create({ document: media });
      return await this.mediaV3Service.repo.save(med);
    }
  }

  async sendMessFile(message: any, client) {
    if (message.files.length) {
      return await client.sendFile(message.peer, {
        file: message.files,
        caption: message.fullText,
        scheduleDate: message.schedule,
        parseMode: 'html',
      });
    } else {
      return await client.sendMessage(message.peer, {
        message: message.fullText,
        schedule: message.schedule,
        parseMode: 'html',
      });
    }
  }

  async getMediaById(id: number) {
    if (!id) return null;
    const media = (await this.mediaV3Service.repo
      .createQueryBuilder('M')
      .where('M.id=:id', { id })
      .leftJoinAndSelect('M.photo', 'photo')
      .leftJoinAndSelect('M.document', 'document')
      .select(['M.id', 'photo.id', 'document.id'])
      .getOne()) || { photo: null, document: null };
    if (media.photo) {
      return await this.mediaV3Service.repo
        .createQueryBuilder('M')
        .where('M.id=:id', { id })
        .innerJoinAndSelect('M.photo', 'photo')
        .leftJoinAndSelect('photo.sizes', 'sizes')
        .leftJoinAndSelect('photo.videosizes', 'videosizes')
        .getOne();
    } else if (media.document) {
      return await this.mediaV3Service.repo
        .createQueryBuilder('M')
        .where('M.id=:id', { id })
        .innerJoinAndSelect('M.document', 'document')
        .leftJoinAndSelect('document.thumbs', 'thumbs')
        .leftJoinAndSelect('document.videothumbs', 'videothumbs')
        .leftJoinAndSelect('document.attributes', 'attributes')
        .getOne();
    }
  }

  async deleteMedia(id: number): Promise<DeleteResult> {
    try {
      return await this.mediaRepo.delete({ id });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }
}
