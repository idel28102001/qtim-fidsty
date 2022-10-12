import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BotsService } from '../../../bots/services/bots.service';
import { WelcomeMessageService } from './welcome-message.service';
import { TelegramBotService } from '../../../telegram/services/telegram-bot.service';
import { MediaService } from '../../../media/services/media.service';
import { TelegramService } from '../../../telegram/services/telegram.service';
import { DiffTypePostsService } from './diff-type-posts.service';
import { CreateCoursePostDto } from '../../dto/bots/course-posts/create-course-post.dto';
import { CoursesService } from './courses.service';
import { TypeOfPostsEnum } from '../../enums/type-of-posts.enum';
import { CreateCoursePostsUploadDto } from '../../dto/bots/course-posts/create-course-posts-upload.dto';
import { CoursePostDto } from '../../dto/bots/course-posts/course-post.dto';
import { SizesEnum } from '../../../media/enums/sizesEnum';
import { getMockImage } from '../../../utils/file-upload.utils';
import { EditCoursePostDto } from '../../dto/bots/course-posts/edit-course-post.dto';
import { DiffTypePostsEntity } from '../../entities/posts/diff-type-posts.entity';
import { MediaV3Entity } from '../../../media/entities/media-v3.entity';
import { CoursePostOrderDto } from '../../dto/bots/course-posts/course-post-order.dto';
import { CoursePostDelayDto } from '../../dto/bots/course-posts/course-post-delay.dto';
import { TelegramTokensEnum } from '../../../telegram/enum/telegram-tokens.enum';
import { CoursesTokensEnum } from '../../enums/tokens/courses.tokens.enum';
import { DiffTypePostsTokensEnum } from '../../enums/tokens/diff-type-posts.tokens.enum';
import { WelcomeMessageTokensEnum } from '../../enums/tokens/welcome-message.tokens.enum';
import { MediaTokensEnum } from '../../../media/enums/tokens/media.tokens.enum';
import { BotsTokenEnum } from '../../../bots/enums/tokens/bots.token.enum';

@Injectable()
export class CoursePostsService {
  constructor(
    @Inject(DiffTypePostsTokensEnum.DIFFTYPEPOSTS_SERVICE_TOKEN)
    private readonly diffTypePostsService: DiffTypePostsService,
    @Inject(WelcomeMessageTokensEnum.WELCOME_MESSAGE_SERVICE_TOKEN)
    private readonly welcomeMessageService: WelcomeMessageService,
    @Inject(CoursesTokensEnum.COURSES_SERVICE_TOKEN)
    private readonly coursesService: CoursesService,
    @Inject(TelegramTokensEnum.TELEGRAM_BOT_SERVICE_TOKEN)
    private readonly telegramBotService: TelegramBotService,
    @Inject(TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN)
    private readonly telegramService: TelegramService,
    @Inject(MediaTokensEnum.MEDIA_SERVICE_TOKEN)
    private readonly mediaService: MediaService,
    @Inject(BotsTokenEnum.BOTS_SERVICE_TOKEN)
    private readonly botsService: BotsService,
  ) {}
  async changeOrder(data: CoursePostOrderDto) {
    const post = await this.diffTypePostsService.repo
      .createQueryBuilder('P')
      .where('P.id=:postId', { postId: data.postId })
      .select(['P.id', 'P.order'])
      .getOne();
    const posts = await this.diffTypePostsService.repo
      .createQueryBuilder('P')
      .innerJoin('P.course', 'course', 'course.id=:courseId', {
        courseId: data.courseId,
      })
      .where('Not P.id=:postId', { postId: data.postId })
      .orderBy('P.order', 'ASC')
      .select(['P.id', 'P.order'])
      .getMany();
    const resPosts = this.insertItemWithOrder(data.order, posts, post);
    return await this.diffTypePostsService.save(resPosts);
  }

  insertItemWithOrder(
    order: number,
    posts: DiffTypePostsEntity[],
    post: DiffTypePostsEntity,
  ) {
    let firstPart, secondPart;
    const orderCond = order > post.order;
    post.order = order;
    if (orderCond) {
      firstPart = posts
        .filter((e) => e.order <= order)
        .map((e) => {
          e.order = e.order - 10;
          return e;
        });
      secondPart = posts
        .filter((e) => e.order > order)
        .map((e) => {
          e.order = e.order + 10;
          return e;
        });
    } else {
      firstPart = posts
        .filter((e) => e.order < post.order)
        .map((e) => {
          e.order = e.order - 10;
          return e;
        });
      secondPart = posts
        .filter((e) => e.order >= post.order)
        .map((e) => {
          e.order = e.order + 10;
          return e;
        });
    }
    firstPart.push(post);
    const resPosts = [...firstPart, ...secondPart].sort((a, b) => {
      if (a.order > b.order) return 1;
      if (a.order < b.order) return -1;
      return 0;
    });
    for (const idx in resPosts) {
      resPosts[idx].order = Number(idx);
    }
    return resPosts;
  }

  async changeDelay(data: CoursePostDelayDto) {
    const post = await this.diffTypePostsService.repo
      .createQueryBuilder('P')
      .where('P.id=:postId', { postId: data.postId })
      .select(['P.id'])
      .getOne();
    post.delay = data.delay;
    return await this.diffTypePostsService.save(post);
  }

  async delete(data: CoursePostDto) {
    await this.diffTypePostsService.repo.delete(data.postId);
    await this.refreshOrder(data.courseId);
  }

  async refreshOrder(courseId: number) {
    const posts = await this.diffTypePostsService.repo
      .createQueryBuilder('P')
      .select(['P.id', 'P.order'])
      .orderBy('P.order', 'ASC')
      .innerJoin('P.course', 'course', 'course.id=:courseId', { courseId })
      .getMany();
    for (const idx in posts) {
      posts[idx].order = Number(idx);
    }
    return await this.diffTypePostsService.repo.save(posts);
  }

  async editPost(
    data: CoursePostDto,
    dto: EditCoursePostDto,
    files: CreateCoursePostsUploadDto,
  ) {
    const post = await this.diffTypePostsService.repo
      .createQueryBuilder('P')
      .where('P.id=:postId', { postId: data.postId })
      .leftJoin('P.attachedSpoiler', 'attachedSpoiler')
      .innerJoin('P.bot', 'bot')
      .select(['P.id', 'attachedSpoiler.id', 'bot.botSession'])
      .getOne();
    const resultPost = this.clearPostFromFilesWithId(post, dto.idsToDelete);
    this.countFilesAndThrowError(
      resultPost.attachedSpoiler,
      files.attachedFiles,
    );
    resultPost.title = dto.title;
    resultPost.description = dto.description;
    resultPost.delay = dto.delay;
    if (files?.attachedFiles?.length) {
      const client = await this.telegramBotService.getTelegramBot(
        post.bot.botSession,
      );
      const mediaFiles = await this.mediaService.prepareOneTypeMessage(
        client,
        process.env.ADMIN_CHANNEL_ID,
        files.attachedFiles,
      );
      resultPost.attachedSpoiler = [
        ...resultPost.attachedSpoiler,
        ...mediaFiles,
      ];
    }
    const result = await this.diffTypePostsService.repo.save(resultPost);
    return {
      id: result.id,
      title: result.title,
      description: result.description,
      delay: result.delay,
      attachedFiles: result.attachedSpoiler,
    };
  }

  countFilesAndThrowError(
    posts: MediaV3Entity[],
    files: Express.Multer.File[],
  ) {
    if (!files?.length) return;
    if (posts.length + files.length > 10) {
      throw new BadRequestException(
        'Суммарное кол-во файлов на основной контент превышает 10-ти',
      );
    }
  }

  clearPostFromFilesWithId(post: DiffTypePostsEntity, idsToDelete: number[]) {
    if (post.attachedSpoiler.length) {
      post.attachedSpoiler = post.attachedSpoiler.filter(
        (e) => !idsToDelete.includes(e.id),
      );
    }
    return post;
  }

  async getCoursePosts(courseId: number, query) {
    const { limit, offset } = query;
    const course = await this.coursesService.repo
      .createQueryBuilder('C')
      .where('C.id=:courseId', { courseId })
      .innerJoin('C.bot', 'bot')
      .innerJoin('C.welcome', 'welcome')
      .leftJoin('welcome.welcomecontent', 'welcomecontent')
      .select(['C.id', 'welcome.id', 'welcomecontent.id', 'bot.botSession'])
      .getOne();
    const posts = await this.diffTypePostsService.repo
      .createQueryBuilder('P')
      .innerJoin('P.course', 'course', 'course.id=:courseId', { courseId })
      .orderBy('P.order', 'DESC')
      .select(['P.id', 'P.order', 'P.title', 'P.createdAt', 'P.delay'])
      .limit(limit)
      .skip(offset)
      .getMany();
    let photo;
    if (course.welcome.welcomecontent) {
      const client = await this.telegramBotService.getTelegramBot(
        course.bot.botSession,
      );
      const file = await this.mediaService.getMediaById(
        course.welcome.welcomecontent.id,
      );
      photo = await this.telegramService.downloadFileV2(file, client);
    } else {
      photo = getMockImage();
    }

    return posts.map((e) => {
      e.delay = Number(e.delay);
      return { ...e, courseId, photo };
    });
  }

  async createPost(
    courseId: number,
    data: CreateCoursePostDto,
    files: CreateCoursePostsUploadDto,
  ) {
    const course = await this.coursesService.repo
      .createQueryBuilder('C')
      .innerJoin('C.bot', 'bot')
      .where('C.id=:courseId', { courseId })
      .select(['C.id', 'bot.botSession', 'bot.id'])
      .loadRelationCountAndMap('C.postsCount', 'C.posts', 'posts')
      .getOne();
    let filesToAttach;
    if (files.attachedFiles) {
      const client = await this.telegramBotService.getTelegramBot(
        course.bot.botSession,
      );
      filesToAttach = await this.mediaService.prepareOneTypeMessage(
        client,
        process.env.ADMIN_CHANNEL_ID,
        files.attachedFiles,
      );
    }
    const post = this.diffTypePostsService.repo.create({
      type: TypeOfPostsEnum.COURSEPOSTS,
      course,
      bot: course.bot,
      description: data.description,
      title: data.title,
      order: (course as any).postsCount,
      delay: data.delay,
      attachedSpoiler: filesToAttach,
    });
    const saved = await this.diffTypePostsService.repo.save(post);
    return {
      id: saved.id,
      title: saved.title,
      description: saved.description,
      order: saved.order,
      delay: saved.delay,
    };
  }

  async getOne(data: CoursePostDto) {
    const post = await this.diffTypePostsService.repo
      .createQueryBuilder('P')
      .where('P.id=:postId', { postId: data.postId })
      .innerJoin('P.bot', 'bot')
      .leftJoin('P.attachedSpoiler', 'attachedSpoiler')
      .select([
        'P.id',
        'P.title',
        'P.description',
        'P.delay',
        'attachedSpoiler.id',
        'bot.botSession',
      ])
      .getOne();
    let attachedFiles = [];
    if (post.attachedSpoiler.length) {
      const client = await this.telegramBotService.getTelegramBot(
        post.bot.botSession,
      );
      attachedFiles = await Promise.all(
        post.attachedSpoiler.map(async (e) => {
          const file = await this.mediaService.getMediaById(e.id);
          return await this.telegramService.downloadFileV2(
            file,
            client,
            SizesEnum.MAX,
          );
        }),
      );
    }
    post.delay = Number(post.delay);
    delete post.bot;
    delete post.attachedSpoiler;

    return { ...post, attachedFiles };
  }
}
