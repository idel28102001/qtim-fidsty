import { Inject, Injectable } from '@nestjs/common';
import {
  FindManyOptions,
  FindOneOptions,
  In,
  RemoveOptions,
  Repository,
} from 'typeorm';
import { MediaV3Entity } from '../entities/media-v3.entity';
import { MediaV3TokensEnum } from '../enums/tokens/media-v3.tokens.enum';

@Injectable()
export class Mediav3Service {
  constructor(
    @Inject(MediaV3TokensEnum.MEDIA_V3_REPOSITORY_TOKEN)
    private readonly mediaV3Repo: Repository<MediaV3Entity>,
  ) {}

  get repo() {
    return this.mediaV3Repo;
  }

  create(some) {
    return this.mediaV3Repo.create(some);
  }

  async save(some) {
    return await this.mediaV3Repo.save(some);
  }

  async findById(id: number, options?: FindOneOptions<MediaV3Entity>) {
    return await this.mediaV3Repo.findOne({ ...{ where: { id } }, ...options });
  }

  async deleteByIds(ids: number[]) {
    const medias = await this.findByIds(ids);
    await Promise.all(
      medias.map(async (e) => {
        await this.remove(e);
      }),
    );
  }

  async findByIds(ids: number[], options?: FindManyOptions<MediaV3Entity>) {
    return await this.mediaV3Repo.find({
      ...{ where: { id: In(ids) } },
      ...options,
    });
  }

  async remove(element: MediaV3Entity, removeOptions?: RemoveOptions) {
    return await this.mediaV3Repo.remove(element, removeOptions);
  }
}
