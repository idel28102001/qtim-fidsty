import { forwardRef, Module } from '@nestjs/common';
import { BotsModule } from '../bots/bots.module';
import { MediaModule } from '../media/media.module';
import { UsersCenterModule } from '../users-center/users-center.module';
import { TelegramModule } from '../telegram/telegram.module';
import { OneOffController } from './controllers/one-off.controller';
import { SubscribePostsController } from './controllers/subscribe-posts.controller';
import { AllKindPostsController } from './controllers/all-kind-posts.controller';
import { CoursesController } from './controllers/courses.controller';
import { CoursePostsController } from './controllers/course-posts.controller';
import { DatabaseModule } from '../database/database.module';
import { PostsProvider } from './posts.provider';
import { DiffTypePostsTokensEnum } from './enums/tokens/diff-type-posts.tokens.enum';
import { OneOffPostsTokensEnum } from './enums/tokens/one-off-posts.tokens.enum';
import { AllKindPostsTokensEnum } from './enums/tokens/all-kind-posts.tokens.enum';
import { CoursesTokensEnum } from './enums/tokens/courses.tokens.enum';
import { WelcomeMessageTokensEnum } from './enums/tokens/welcome-message.tokens.enum';
import { CoursesPostsTokensEnum } from './enums/tokens/courses-posts.tokens.enum';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => BotsModule),
    UsersCenterModule,
    TelegramModule,
    MediaModule,
  ],
  controllers: [
    OneOffController,
    SubscribePostsController,
    AllKindPostsController,
    CoursesController,
    CoursePostsController,
  ],
  providers: PostsProvider,
  exports: [
    OneOffPostsTokensEnum.ONEOFF_SERVICE_TOKEN,
    AllKindPostsTokensEnum.ALLKINDPOSTS_SERVICE_TOKEN,
    CoursesTokensEnum.COURSES_SERVICE_TOKEN,
    WelcomeMessageTokensEnum.WELCOME_MESSAGE_SERVICE_TOKEN,
    DiffTypePostsTokensEnum.DIFFTYPEPOSTS_SERVICE_TOKEN,
    CoursesPostsTokensEnum.COURSES_POSTS_SERVICE_TOKEN,
  ],
})
export class PostsModule {}
