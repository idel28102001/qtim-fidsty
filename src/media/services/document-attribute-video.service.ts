import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Api } from 'telegram';
import { DocumentAttributeVideoEntity } from '../entities/media/document/documentAttributeVideo.entity';
import { DocumentAttributeVideoTokensEnum } from '../enums/tokens/document-attribute-video.tokens.enum';

@Injectable()
export class DocumentAttributeVideoService {
  constructor(
    @Inject(
      DocumentAttributeVideoTokensEnum.DOCUMENT_ATTRIBUTE_VIDEO_REPOSITORY_TOKEN,
    )
    private readonly documentAttributeVideoService: Repository<DocumentAttributeVideoEntity>,
  ) {}

  createEntity(documentAttributeVideos: Api.DocumentAttributeVideo[]) {
    return this.documentAttributeVideoService.create(documentAttributeVideos);
  }
}
