import { Inject, NotFoundException, ValidationPipe } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ChannelsService } from '../services/channels.service';
import { ChannelsTokensEnum } from '../enums/tokens/channels.tokens.enum';

export class ExistChannelIdPipe extends ValidationPipe {
  constructor(
    @Inject(REQUEST) public request: any,
    @Inject(ChannelsTokensEnum.CHANNELS_SERVICE_TOKEN)
    private readonly channelsService: ChannelsService,
  ) {
    super({
      transform: true,
    });
  }

  async transform(id) {
    try {
      await this.channelsService.repo
        .createQueryBuilder('channels')
        .innerJoinAndSelect('channels.user', 'user', 'user.id=:channelId', {
          channelId: this.request.user.userId,
        })
        .where('channels.id=:id', { id: Number(id) })
        .getOneOrFail();
      return id;
    } catch (e) {
      throw new NotFoundException('Такого канала у пользователя нет');
    }
  }
}
