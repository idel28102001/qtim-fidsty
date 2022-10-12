import { Provider } from '@nestjs/common';
import { DATABASE_SOURCE_TOKEN } from '../database/databse.constant';
import { DataSource } from 'typeorm';
import { DocumentTokensEnum } from './enums/tokens/document.tokens.enum';
import { DocumentEntity } from './entities/media/document/document.entity';
import { DocumentAttributeVideoTokensEnum } from './enums/tokens/document-attribute-video.tokens.enum';
import { DocumentAttributeVideoEntity } from './entities/media/document/documentAttributeVideo.entity';
import { MediaTokensEnum } from './enums/tokens/media.tokens.enum';
import { MediaEntity } from './entities/media.entity';
import { MediaV3TokensEnum } from './enums/tokens/media-v3.tokens.enum';
import { MediaV3Entity } from './entities/media-v3.entity';
import { PhotoTokensEnum } from './enums/tokens/photo.tokens.enum';
import { PhotoEntity } from './entities/media/photo/photo.entity';
import { PhotoSizeTokensEnum } from './enums/tokens/photo-size.tokens.enum';
import { PhotoSizeEntity } from './entities/media/photo/photo-size.entity';
import { VideoSizeTokensEnum } from './enums/tokens/video-size.tokens.enum';
import { VideoSizeEntity } from './entities/media/photo/video-size.entity';
import { DocumentService } from './services/document.service';
import { DocumentAttributeVideoService } from './services/document-attribute-video.service';
import { MediaService } from './services/media.service';
import { Mediav3Service } from './services/mediav3.service';
import { PhotoSizeService } from './services/photo-size.service';
import { PhotoService } from './services/photo.service';
import { VideoSizeService } from './services/video-size.service';

export const MediaProvider: Provider[] = [
  {
    provide: DocumentTokensEnum.DOCUMENT_SERVICE_TOKEN,
    useClass: DocumentService,
  },
  {
    provide:
      DocumentAttributeVideoTokensEnum.DOCUMENT_ATTRIBUTE_VIDEO_SERVICE_TOKEN,
    useClass: DocumentAttributeVideoService,
  },
  {
    provide: MediaTokensEnum.MEDIA_SERVICE_TOKEN,
    useClass: MediaService,
  },
  {
    provide: MediaV3TokensEnum.MEDIA_V3_SERVICE_TOKEN,
    useClass: Mediav3Service,
  },
  {
    provide: PhotoSizeTokensEnum.PHOTO_SIZE_SERVICE_TOKEN,
    useClass: PhotoSizeService,
  },
  {
    provide: PhotoTokensEnum.PHOTO_SERVICE_TOKEN,
    useClass: PhotoService,
  },
  {
    provide: VideoSizeTokensEnum.VIDEO_SIZE_SERVICE_TOKEN,
    useClass: VideoSizeService,
  },
  {
    provide: DocumentTokensEnum.DOCUMENT_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(DocumentEntity),
  },
  {
    provide:
      DocumentAttributeVideoTokensEnum.DOCUMENT_ATTRIBUTE_VIDEO_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(DocumentAttributeVideoEntity),
  },
  {
    provide: MediaTokensEnum.MEDIA_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(MediaEntity),
  },
  {
    provide: MediaV3TokensEnum.MEDIA_V3_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(MediaV3Entity),
  },
  {
    provide: PhotoTokensEnum.PHOTO_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(PhotoEntity),
  },
  {
    provide: PhotoSizeTokensEnum.PHOTO_SIZE_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(PhotoSizeEntity),
  },
  {
    provide: VideoSizeTokensEnum.VIDEO_SIZE_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(VideoSizeEntity),
  },
];
