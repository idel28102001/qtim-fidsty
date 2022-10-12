import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Api } from 'telegram';
import { PhotoEntity } from '../entities/media/photo/photo.entity';
import { PhotoSizeService } from './photo-size.service';
import { VideoSizeService } from './video-size.service';
import { PhotoTokensEnum } from '../enums/tokens/photo.tokens.enum';
import { PhotoSizeTokensEnum } from '../enums/tokens/photo-size.tokens.enum';
import { VideoSizeTokensEnum } from '../enums/tokens/video-size.tokens.enum';

@Injectable()
export class PhotoService {
  constructor(
    @Inject(PhotoTokensEnum.PHOTO_REPOSITORY_TOKEN)
    private readonly photoRepo: Repository<PhotoEntity>,
    @Inject(PhotoSizeTokensEnum.PHOTO_SIZE_SERVICE_TOKEN)
    private readonly photoSizeService: PhotoSizeService,
    @Inject(VideoSizeTokensEnum.VIDEO_SIZE_SERVICE_TOKEN)
    private readonly videoSizeService: VideoSizeService,
  ) {}

  async createEntity(media: Api.TypeMessageMedia, file: Express.Multer.File) {
    const photo = (media as any).photo;
    const sizes = this.photoSizeService.createEntity(photo.sizes);
    const videosizes = this.videoSizeService.createEntity(photo.videoSizes);
    const resPhoto = this.photoRepo.create({
      hasStickers: photo.hasStickers,
      telegramId: Buffer.from(photo.id.toString()),
      accessHash: Buffer.from(photo.accessHash.toString()),
      fileReference: photo.fileReference,
      date: photo.date,
      sizes,
      videosizes,
      dcId: photo.dcId,
      mimeType: file.mimetype,
    });
    return await this.photoRepo.save(resPhoto);
  }
}
