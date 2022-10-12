import { Inject, Injectable } from '@nestjs/common';
import { CoursesEntity } from '../../entities/posts/courses.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { CreateCourseDto } from '../../dto/bots/course/create-course.dto';
import { CreateCourseUploadDto } from '../../dto/bots/course/create-course-upload.dto';
import { BotsService } from '../../../bots/services/bots.service';
import { WelcomeMessageService } from './welcome-message.service';
import { TelegramBotService } from '../../../telegram/services/telegram-bot.service';
import { MediaService } from '../../../media/services/media.service';
import { TelegramService } from '../../../telegram/services/telegram.service';
import { getMockImage } from '../../../utils/file-upload.utils';
import { SizesEnum } from '../../../media/enums/sizesEnum';
import { EditCourseDto } from '../../dto/bots/course/edit-course.dto';
import { TelegramTokensEnum } from '../../../telegram/enum/telegram-tokens.enum';
import { CoursesTokensEnum } from '../../enums/tokens/courses.tokens.enum';
import { WelcomeMessageTokensEnum } from '../../enums/tokens/welcome-message.tokens.enum';
import { MediaTokensEnum } from '../../../media/enums/tokens/media.tokens.enum';
import { BotsTokenEnum } from '../../../bots/enums/tokens/bots.token.enum';

@Injectable()
export class CoursesService {
  constructor(
    @Inject(CoursesTokensEnum.COURSES_REPOSITORY_TOKEN)
    private readonly coursesRepo: Repository<CoursesEntity>,
    @Inject(WelcomeMessageTokensEnum.WELCOME_MESSAGE_SERVICE_TOKEN)
    private readonly welcomeMessageService: WelcomeMessageService,
    @Inject(TelegramTokensEnum.TELEGRAM_BOT_SERVICE_TOKEN)
    private readonly telegramBotService: TelegramBotService,
    @Inject(TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN)
    private readonly telegramService: TelegramService,
    @Inject(MediaTokensEnum.MEDIA_SERVICE_TOKEN)
    private readonly mediaService: MediaService,
    @Inject(BotsTokenEnum.BOTS_SERVICE_TOKEN)
    private readonly botsService: BotsService,
  ) {}

  get repo() {
    return this.coursesRepo;
  }

  async deleteCourse(id: number) {
    const post = await this.coursesRepo
      .createQueryBuilder('C')
      .where('C.id=:id', { id })
      .getOne();
    return await this.coursesRepo.remove(post);
  }

  async findById(id: number, options?: FindOneOptions<CoursesEntity>) {
    return await this.coursesRepo.findOne({ ...{ where: { id } }, ...options });
  }

  async createCourse(dto: CreateCourseDto, files: CreateCourseUploadDto) {
    const bot = await this.botsService.findById(dto.botId);
    const client = await this.telegramBotService.getTelegramBot(bot.botSession);
    const welcome = await this.welcomeMessageService.createWelcome(
      dto,
      client,
      files,
    );
    const course = this.coursesRepo.create({
      title: dto.title,
      cost: Number(dto.cost),
      currency: dto.currency,
      bot,
      welcome,
    });
    return await this.coursesRepo.save(course);
  }

  async getCourses(botId: number) {
    const { botSession } = await this.botsService.repo
      .createQueryBuilder('bot')
      .where('bot.id=:botId', { botId })
      .select('bot.botSession')
      .getOne();
    const client = await this.telegramBotService.getTelegramBot(botSession);
    const courses = await this.coursesRepo
      .createQueryBuilder('C')
      .innerJoin('C.bot', 'bot')
      .innerJoin('C.welcome', 'welcome')
      .leftJoin('welcome.welcomecontent', 'welcomecontent')
      .addSelect(['welcome.id', 'welcomecontent.id'])
      .orderBy('C.id', 'DESC')
      .where('bot.id=:botId', { botId })
      .getMany();
    return await Promise.all(
      courses.map(async (e) => {
        const welcome = e.welcome?.welcomecontent?.id;
        let photo;
        if (welcome) {
          const file = await this.mediaService.getMediaById(welcome);
          photo = await this.telegramService.downloadFileV2(file, client);
        } else {
          photo = getMockImage();
        }
        return {
          id: e.id,
          title: e.title,
          cost: e.cost,
          currency: e.currency,
          subscribersCount: 0,
          postsCount: 0,
          photo,
        };
      }),
    );
  }

  async editCourse(
    id: number,
    dto: EditCourseDto,
    files: CreateCourseUploadDto,
  ) {
    const post = await this.getPostById(id);
    const client = await this.telegramBotService.getTelegramBot(
      post.bot.botSession,
    );
    post.welcome = await this.welcomeMessageService.editMessage(
      post.welcome,
      dto,
      files,
      client,
    );
    post.cost = dto.cost;
    post.currency = dto.currency;
    post.title = dto.title;
    return await this.coursesRepo.save(post);
  }

  async getPostById(id: number) {
    return await this.coursesRepo
      .createQueryBuilder('courses')
      .where('courses.id=:id', { id })
      .innerJoin('courses.bot', 'bot')
      .innerJoinAndSelect('courses.welcome', 'welcome')
      .leftJoinAndSelect('welcome.welcomecontent', 'welcomecontent')
      .leftJoinAndSelect('welcome.paymentcontent', 'paymentcontent')
      .addSelect([
        'bot.botSession',
        'welcome.id',
        'welcomecontent.id',
        'paymentcontent.id',
      ])
      .getOne();
  }

  async getCourse(id: number) {
    const post = await this.getPostById(id);
    const client = await this.telegramBotService.getTelegramBot(
      post.bot.botSession,
    );
    let paymentContent = null,
      welcomeContent = null;
    if (post.welcome.welcomecontent) {
      const file = await this.mediaService.getMediaById(
        post.welcome.welcomecontent.id,
      );
      welcomeContent = await this.telegramService.downloadFileV2(
        file,
        client,
        SizesEnum.MAX,
      );
    }
    if (post.welcome.paymentcontent) {
      const file = await this.mediaService.getMediaById(
        post.welcome.paymentcontent.id,
      );
      paymentContent = await this.telegramService.downloadFileV2(
        file,
        client,
        SizesEnum.MAX,
      );
    }
    return {
      title: post.title,
      cost: post.cost,
      currency: post.currency,
      welcomeMessage: post.welcome.welcomeMessage.toString(),
      paymentMessage: post.welcome.paymentMessage.toString(),
      welcomeContent,
      paymentContent,
    };
  }
}
