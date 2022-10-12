import { Inject, NotFoundException, ValidationPipe } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ChannelsService } from '../services/channels.service';
import { ChannelsTokensEnum } from '../enums/tokens/channels.tokens.enum';

export class AddedChannelIdPipe extends ValidationPipe {
  constructor(
    @Inject(REQUEST) public request: any,
    @Inject(ChannelsTokensEnum.CHANNELS_SERVICE_TOKEN)
    private readonly channelsService: ChannelsService,
  ) {
    super({
      transform: true,
    });
  }

  async transform(channelId) {
    const channel = await this.channelsService.findByData({
      where: { channelId },
    });

    if (channel) {
      throw new NotFoundException('Канал уже добавлен в базу');
    }

    return channelId;
  }
}
