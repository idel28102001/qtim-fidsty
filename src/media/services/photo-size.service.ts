import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Api } from 'telegram';
import { PhotoSizeEntity } from '../entities/media/photo/photo-size.entity';
import { PhotoSizeTokensEnum } from '../enums/tokens/photo-size.tokens.enum';

@Injectable()
export class PhotoSizeService {
  constructor(
    @Inject(PhotoSizeTokensEnum.PHOTO_SIZE_REPOSITORY_TOKEN)
    private readonly photoSizeRepo: Repository<PhotoSizeEntity>,
  ) {}

  createEntity(photoSizes: Api.PhotoSize[]) {
    return this.photoSizeRepo.create(photoSizes);
  }
}
