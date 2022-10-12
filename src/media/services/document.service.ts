import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Api } from 'telegram';
import { PhotoSizeService } from './photo-size.service';
import { VideoSizeService } from './video-size.service';
import { DocumentEntity } from '../entities/media/document/document.entity';
import { DocumentAttributeVideoService } from './document-attribute-video.service';
import { DocumentTokensEnum } from '../enums/tokens/document.tokens.enum';
import { PhotoSizeTokensEnum } from '../enums/tokens/photo-size.tokens.enum';
import { VideoSizeTokensEnum } from '../enums/tokens/video-size.tokens.enum';
import { DocumentAttributeVideoTokensEnum } from '../enums/tokens/document-attribute-video.tokens.enum';

@Injectable()
export class DocumentService {
  constructor(
    @Inject(DocumentTokensEnum.DOCUMENT_REPOSITORY_TOKEN)
    private readonly documentRepo: Repository<DocumentEntity>,
    @Inject(PhotoSizeTokensEnum.PHOTO_SIZE_SERVICE_TOKEN)
    private readonly photoSizeService: PhotoSizeService,
    @Inject(VideoSizeTokensEnum.VIDEO_SIZE_SERVICE_TOKEN)
    private readonly videoSizeService: VideoSizeService,
    @Inject(
      DocumentAttributeVideoTokensEnum.DOCUMENT_ATTRIBUTE_VIDEO_SERVICE_TOKEN,
    )
    private readonly documentAttributeVideoService: DocumentAttributeVideoService,
  ) {}

  async createEntity(media: Api.TypeMessageMedia) {
    const document = (media as any).document;
    const thumbs = this.photoSizeService.createEntity(document.thumbs);
    const videothumbs = this.videoSizeService.createEntity(document.thumbSize);
    const attributes = this.documentAttributeVideoService.createEntity(
      document.attributes,
    );
    const resDocument = this.documentRepo.create({
      telegramId: Buffer.from(document.id.toString()),
      accessHash: Buffer.from(document.accessHash.toString()),
      fileReference: document.fileReference,
      date: document.date,
      mimeType: document.mimeType,
      thumbs,
      videothumbs,
      dcId: document.dcId,
      attributes,
      size: document.size,
    });
    return await this.documentRepo.save(resDocument);
  }
}
