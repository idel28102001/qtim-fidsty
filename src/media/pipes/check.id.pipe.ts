import {
  Inject,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { MediaService } from '../services/media.service';
import { MediaTokensEnum } from '../enums/tokens/media.tokens.enum';

@Injectable()
export class CheckIdPipe implements PipeTransform {
  constructor(
    @Inject(MediaTokensEnum.MEDIA_SERVICE_TOKEN)
    private readonly mediaService: MediaService,
  ) {}

  async transform(id) {
    const media = await this.mediaService.findMediaById(id);

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return id;
  }
}
