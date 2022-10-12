import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Api } from 'telegram';
import { VideoSizeEntity } from '../entities/media/photo/video-size.entity';
import { VideoSizeTokensEnum } from '../enums/tokens/video-size.tokens.enum';

@Injectable()
export class VideoSizeService {
  constructor(
    @Inject(VideoSizeTokensEnum.VIDEO_SIZE_REPOSITORY_TOKEN)
    private readonly videoSize: Repository<VideoSizeEntity>,
  ) {}

  createEntity(videoSizes: Api.VideoSize[]) {
    return this.videoSize.create(videoSizes);
  }
}
