import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/users/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user.role.enum';
import { CoursePostsService } from '../services/posts/course-posts.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { imageVideoFilter } from '../../utils/file-upload.utils';
import { CheckCoursesIdPipe } from '../pipes/check-courses-id.pipe';
import { CreateCoursePostDto } from '../dto/bots/course-posts/create-course-post.dto';
import { ParseDelayIntPipe } from '../pipes/parse-delay-int.pipe';
import { CreateCoursePostsUploadDto } from '../dto/bots/course-posts/create-course-posts-upload.dto';
import { CheckCoursePostIdPipe } from '../pipes/check-course-post-id.pipe';
import { CoursePostDto } from '../dto/bots/course-posts/course-post.dto';
import { QueryLimitOffsetPipe } from '../pipes/query-limit-offset.pipe';
import { EditCoursePostDto } from '../dto/bots/course-posts/edit-course-post.dto';
import { TransferIdsToListPipe } from '../pipes/transfer-ids-to-list-pipe';
import { StatusCodeException } from '../../exception/status.code.exception';
import { CheckCoursePostOrderPipe } from '../pipes/check-course-post-order.pipe';
import { CoursePostOrderDto } from '../dto/bots/course-posts/course-post-order.dto';
import { CheckCoursePostDelayPipe } from '../pipes/check-course-post-delay.pipe';
import { CoursePostDelayDto } from '../dto/bots/course-posts/course-post-delay.dto';
import { CoursesTokensEnum } from '../enums/tokens/courses.tokens.enum';

@ApiTags('Bot Consistent Posts')
@Controller('posts/courses/:courseId/posts')
@Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
export class CoursePostsController {
  constructor(
    @Inject(CoursesTokensEnum.COURSES_SERVICE_TOKEN)
    private readonly coursePostsService: CoursePostsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'attachedFiles', maxCount: 10 }], {
      fileFilter: imageVideoFilter,
      limits: {
        fileSize: 4e7,
        files: 10,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  async createPost(
    @Param('courseId', CheckCoursesIdPipe, ParseIntPipe) courseId: number,
    @Body(ParseDelayIntPipe) data: CreateCoursePostDto,
    @UploadedFiles()
    files: CreateCoursePostsUploadDto,
  ) {
    return await this.coursePostsService.createPost(courseId, data, files);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':postId')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'attachedFiles', maxCount: 10 }], {
      fileFilter: imageVideoFilter,
      limits: {
        fileSize: 4e7,
        files: 10,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  async editPost(
    @Param(CheckCoursePostIdPipe) data: CoursePostDto,
    @Body(TransferIdsToListPipe, ParseDelayIntPipe) dto: EditCoursePostDto,
    @UploadedFiles()
    files: CreateCoursePostsUploadDto,
  ) {
    return await this.coursePostsService.editPost(data, dto, files);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':postId/changeDelay/:delay')
  async changeDelay(
    @Param(CheckCoursePostIdPipe, CheckCoursePostDelayPipe)
    data: CoursePostDelayDto,
  ) {
    await this.coursePostsService.changeDelay(data);
    throw new StatusCodeException(HttpStatus.OK, 'Data successfully updated');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':postId/changeOrder/:order')
  async changeOrder(
    @Param(CheckCoursePostIdPipe, CheckCoursePostOrderPipe)
    data: CoursePostOrderDto,
  ) {
    await this.coursePostsService.changeOrder(data);
    throw new StatusCodeException(HttpStatus.OK, 'Data successfully updated');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':postId')
  async getPostById(@Param(CheckCoursePostIdPipe) data: CoursePostDto) {
    return await this.coursePostsService.getOne(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async getCoursePosts(
    @Query(QueryLimitOffsetPipe) query,
    @Param('courseId', CheckCoursesIdPipe) courseId: number,
  ) {
    return await this.coursePostsService.getCoursePosts(courseId, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':postId')
  async deleteById(@Param(CheckCoursePostIdPipe) data: CoursePostDto) {
    await this.coursePostsService.delete(data);
    throw new StatusCodeException(HttpStatus.OK, 'Data successfully deleted');
  }
}
