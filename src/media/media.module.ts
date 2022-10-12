import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { TelegramModule } from '../telegram/telegram.module';
import { MediaProvider } from './media.provider';
import { DatabaseModule } from '../database/database.module';
import { MediaTokensEnum } from './enums/tokens/media.tokens.enum';
import { PhotoTokensEnum } from './enums/tokens/photo.tokens.enum';
import { VideoSizeTokensEnum } from './enums/tokens/video-size.tokens.enum';
import { PhotoSizeTokensEnum } from './enums/tokens/photo-size.tokens.enum';
import { DocumentAttributeVideoTokensEnum } from './enums/tokens/document-attribute-video.tokens.enum';
import { DocumentTokensEnum } from './enums/tokens/document.tokens.enum';
import { MediaV3TokensEnum } from './enums/tokens/media-v3.tokens.enum';

@Module({
  imports: [DatabaseModule, TelegramModule],
  providers: MediaProvider,
  exports: [
    MediaTokensEnum.MEDIA_SERVICE_TOKEN,
    PhotoTokensEnum.PHOTO_SERVICE_TOKEN,
    VideoSizeTokensEnum.VIDEO_SIZE_SERVICE_TOKEN,
    PhotoSizeTokensEnum.PHOTO_SIZE_SERVICE_TOKEN,
    DocumentAttributeVideoTokensEnum.DOCUMENT_ATTRIBUTE_VIDEO_SERVICE_TOKEN,
    DocumentTokensEnum.DOCUMENT_SERVICE_TOKEN,
    MediaV3TokensEnum.MEDIA_V3_SERVICE_TOKEN,
  ],
  controllers: [MediaController],
})
export class MediaModule {}
