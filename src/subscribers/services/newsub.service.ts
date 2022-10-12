import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { NewsubEntity } from '../entities/newsub.entity';
import { NewsubsTokensEnum } from '../enums/newsubs-tokens.enum';

@Injectable()
export class NewsubService {
  constructor(
    @Inject(NewsubsTokensEnum.NEWSUBS_REPOSITORY_TOKEN)
    private readonly newsubRepo: Repository<NewsubEntity>,
  ) {}

  async find(options) {
    return await this.newsubRepo.find(options);
  }

  async save(data) {
    return (await this.newsubRepo.save(data)) as any as NewsubEntity;
  }

  create(data) {
    return this.newsubRepo.create(data);
  }
}
