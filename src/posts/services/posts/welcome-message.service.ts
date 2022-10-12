import { Inject, Injectable } from '@nestjs/common';
import { WelcomeMessageEntity } from '../../entities/posts/welcome-message.entity';
import { Repository } from 'typeorm';
import { CreateCourseDto } from '../../dto/bots/course/create-course.dto';
import { TelegramService } from '../../../telegram/services/telegram.service';
import { TelegramClient } from 'telegram';
import { MediaService } from '../../../media/services/media.service';
import { CreateCourseUploadDto } from '../../dto/bots/course/create-course-upload.dto';
import { EditCourseDto } from '../../dto/bots/course/edit-course.dto';
import { TelegramTokensEnum } from '../../../telegram/enum/telegram-tokens.enum';
import { WelcomeMessageTokensEnum } from '../../enums/tokens/welcome-message.tokens.enum';
import { MediaTokensEnum } from '../../../media/enums/tokens/media.tokens.enum';

@Injectable()
export class WelcomeMessageService {
  constructor(
    @Inject(WelcomeMessageTokensEnum.WELCOME_MESSAGE_REPOSITORY_TOKEN)
    private readonly welcomeMessageRepo: Repository<WelcomeMessageEntity>,
    @Inject(TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN)
    private readonly telegramService: TelegramService,
    @Inject(MediaTokensEnum.MEDIA_SERVICE_TOKEN)
    private readonly mediaService: MediaService,
  ) {}

  async editMessage(
    welcome: WelcomeMessageEntity,
    dto: EditCourseDto,
    files: CreateCourseUploadDto,
    client: TelegramClient,
  ) {
    welcome.welcomecontent = dto.idsToDelete.includes(
      welcome.welcomecontent?.id,
    )
      ? null
      : welcome.welcomecontent;
    welcome.paymentcontent = dto.idsToDelete.includes(
      welcome.paymentcontent?.id,
    )
      ? null
      : welcome.paymentcontent;
    welcome.welcomeMessage = Buffer.from(dto.welcomeMessage);
    welcome.paymentMessage = Buffer.from(dto.paymentMessage);
    if (files.paymentFile) {
      const paymentcontent = await this.mediaService.prepareOneTypeMessage(
        client,
        process.env.ADMIN_CHANNEL_ID,
        files.paymentFile,
      );
      welcome.paymentcontent = paymentcontent[0];
    }
    if (files.welcomeFile) {
      const welcomecontent = await this.mediaService.prepareOneTypeMessage(
        client,
        process.env.ADMIN_CHANNEL_ID,
        files.welcomeFile,
      );
      welcome.welcomecontent = welcomecontent[0];
    }
    return await this.welcomeMessageRepo.save(welcome);
  }

  async createWelcome(
    dto: CreateCourseDto,
    client: TelegramClient,
    files: CreateCourseUploadDto,
  ) {
    const welcomecontent = await this.mediaService.prepareOneTypeMessage(
      client,
      process.env.ADMIN_CHANNEL_ID,
      files.welcomeFile,
    );
    const paymentcontent = await this.mediaService.prepareOneTypeMessage(
      client,
      process.env.ADMIN_CHANNEL_ID,
      files.paymentFile,
    );
    const welcome = this.welcomeMessageRepo.create({
      welcomeMessage: Buffer.from(dto.welcomeMessage),
      paymentMessage: Buffer.from(dto.paymentMessage),
      welcomecontent: welcomecontent[0],
      paymentcontent: paymentcontent[0],
    });
    return await this.welcomeMessageRepo.save(welcome);
  }
}
