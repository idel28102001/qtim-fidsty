import { Provider } from '@nestjs/common';
import { DATABASE_SOURCE_TOKEN } from '../database/databse.constant';
import { DataSource } from 'typeorm';
import { AllKindPostsTokensEnum } from './enums/tokens/all-kind-posts.tokens.enum';
import { AllPostsService } from './services/all-posts.service';
import { CoursesTokensEnum } from './enums/tokens/courses.tokens.enum';
import { DiffTypePostsTokensEnum } from './enums/tokens/diff-type-posts.tokens.enum';
import { OneOffPostsTokensEnum } from './enums/tokens/one-off-posts.tokens.enum';
import { SubscribePostsTokensEnum } from './enums/tokens/subscribe-posts.tokens.enum';
import { WelcomeMessageTokensEnum } from './enums/tokens/welcome-message.tokens.enum';
import { CoursePostsService } from './services/posts/course-posts.service';
import { DiffTypePostsService } from './services/posts/diff-type-posts.service';
import { OneoffpostsService } from './services/posts/oneoffposts.service';
import { SubscribePostsService } from './services/posts/subscribe-posts.service';
import { WelcomeMessageService } from './services/posts/welcome-message.service';
import { CoursesEntity } from './entities/posts/courses.entity';
import { DiffTypePostsEntity } from './entities/posts/diff-type-posts.entity';
import { WelcomeMessageEntity } from './entities/posts/welcome-message.entity';
import { CoursesService } from './services/posts/courses.service';
import { CoursesPostsTokensEnum } from './enums/tokens/courses-posts.tokens.enum';

export const PostsProvider: Provider[] = [
  {
    provide: AllKindPostsTokensEnum.ALLKINDPOSTS_SERVICE_TOKEN,
    useClass: AllPostsService,
  },
  {
    provide: CoursesTokensEnum.COURSES_SERVICE_TOKEN,
    useClass: CoursesService,
  },
  {
    provide: CoursesPostsTokensEnum.COURSES_POSTS_SERVICE_TOKEN,
    useClass: CoursePostsService,
  },
  {
    provide: DiffTypePostsTokensEnum.DIFFTYPEPOSTS_SERVICE_TOKEN,
    useClass: DiffTypePostsService,
  },
  {
    provide: OneOffPostsTokensEnum.ONEOFF_SERVICE_TOKEN,
    useClass: OneoffpostsService,
  },
  {
    provide: SubscribePostsTokensEnum.SUBSCRIBE_POSTS_SERVICE_TOKEN,
    useClass: SubscribePostsService,
  },
  {
    provide: WelcomeMessageTokensEnum.WELCOME_MESSAGE_SERVICE_TOKEN,
    useClass: WelcomeMessageService,
  },
  {
    provide: CoursesTokensEnum.COURSES_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(CoursesEntity),
  },
  {
    provide: DiffTypePostsTokensEnum.DIFFTYPEPOSTS_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(DiffTypePostsEntity),
  },
  {
    provide: WelcomeMessageTokensEnum.WELCOME_MESSAGE_REPOSITORY_TOKEN,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(WelcomeMessageEntity),
  },
];
