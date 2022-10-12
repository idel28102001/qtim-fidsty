import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as tg from 'telegraf/src/core/types/typegram';
import { ExtraPhoto } from 'telegraf/typings/telegram-types';
import { SubscriberEntity } from '../../subscribers/entities/subscriber.entity';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { TelegramService } from './telegram.service';
import { Button } from 'telegram/tl/custom/button';
import { TelegramTokensEnum } from '../enum/telegram-tokens.enum';

@Injectable()
export class TelegramBotService {
  constructor(
    @Inject(TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN)
    private readonly telegramService: TelegramService,
  ) {}

  async getTelegramBot(botSession: string) {
    const apiId = Number(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH;
    const client = new TelegramClient(
      new StringSession(botSession),
      apiId,
      apiHash,
      { connectionRetries: 5 },
    );
    await client.connect();
    return client;
  }

  async registerTelegramBot(token: string) {
    const apiId = Number(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH;
    const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
      connectionRetries: 5,
    });
    try {
      await client.start({
        botAuthToken: token,
      });
    } catch (e) {
      throw new BadRequestException(e);
    }
    return client.session.save() as any as string;
  }

  makePreviewText(title: string, previewText: string) {
    return `<b>${title}</b> \n \n` + `${previewText}`;
  }

  makeMessageFull(title: string, description?: string) {
    const formattedDescription = description
      ? description
          .replace(/<p( *\w+=("[^"]*"|'[^']'|[^ >]))*>/g, '')
          .replace(/<\/p( *\w+=("[^"]*"|'[^']'|[^ >]))*>/g, ' ')
          .replace(/<br( *\w+=("[^"]*"|'[^']'|[^ >]))*>/g, '')
          .replace(/<\/br( *\w+=("[^"]*"|'[^']'|[^ >]))*>/g, ' ')
      : '';
    return `<b>${title}</b> \n \n` + `${formattedDescription}`;
  }

  makeAttachedFiles(attachedFiles) {
    attachedFiles = attachedFiles || [];
    const imagesFiles = attachedFiles.filter((item) =>
      item.name.match(/\.(jpg|jpeg|png)$/),
    );

    const images: ReadonlyArray<tg.InputMediaPhoto> = imagesFiles.map(
      (item) => {
        return {
          type: 'photo',
          media: item.fileId,
        };
      },
    );

    const videoFiles = attachedFiles.filter((item) =>
      item.name.match(/\.(mp4)$/),
    );
    const video: ReadonlyArray<tg.InputMediaVideo> = videoFiles.map((item) => {
      return {
        type: 'video',
        media: item.fileId,
      };
    });
    return [...images, ...video];
  }

  makeOrNotInlineKeyboard(messagePreview, keyboardActive, id): ExtraPhoto {
    return {
      parse_mode: 'HTML',
      caption: messagePreview,
      reply_markup: keyboardActive && {
        inline_keyboard: [
          [
            {
              text: 'Читать полностью',
              callback_data: `sendMessage-(${id})`,
            },
          ],
        ],
      },
    };
  }

  async sendToAllSubs(
    subscribers: SubscriberEntity[],
    botClient: TelegramClient,
    id: number,
    messagePreview,
    media?,
  ) {
    await Promise.all(
      subscribers.map(async (e) => {
        const userEntity = await this.telegramService.getEntity(
          e.telegramId,
          botClient,
        );
        const markup = botClient.buildReplyMarkup(
          Button.inline('Читать полностью!!!', Buffer.from(String(id))),
        );
        if (media) {
          await botClient.sendFile(userEntity, {
            file: media,
            caption: messagePreview,
            parseMode: 'html',
            buttons: markup,
          });
        } else {
          await botClient.sendMessage(userEntity, {
            message: messagePreview,
            buttons: markup,
            parseMode: 'html',
          });
        }
      }),
    );
  }

  async replyWithPost(post, ctx) {
    const attachedFiles = this.makeAttachedFiles(post.attachedFiles);
    const messageFull = this.makeMessageFull(post.title, post.description);
    if (attachedFiles.length) {
      await ctx.replyWithMediaGroup(attachedFiles);
    }
    await ctx.reply(messageFull, {
      parse_mode: 'HTML',
    });
  }
}
