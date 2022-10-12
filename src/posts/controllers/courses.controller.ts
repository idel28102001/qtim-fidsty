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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/users/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user.role.enum';
import { CoursesService } from '../services/posts/courses.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateCourseUploadDto } from '../dto/bots/course/create-course-upload.dto';
import { CreateCourseDto } from '../dto/bots/course/create-course.dto';
import { CheckCoursesIdPipe } from '../pipes/check-courses-id.pipe';
import { BotIdExistsForPostsPipe } from '../pipes/bot-id-exists-for-posts-pipe';
import { BotIdExistsPipe } from '../../bots/pipes/bot-id-exists-pipe';
import { EditCourseDto } from '../dto/bots/course/edit-course.dto';
import { TransferIdsToListPipe } from '../pipes/transfer-ids-to-list-pipe';
import { StatusCodeException } from '../../exception/status.code.exception';
import { CoursesTokensEnum } from '../enums/tokens/courses.tokens.enum';

@ApiTags('Bot Consistent Posts')
@Controller('posts/courses/')
@Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
export class CoursesController {
  constructor(
    @Inject(CoursesTokensEnum.COURSES_SERVICE_TOKEN)
    private coursesService: CoursesService,
  ) {}
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'welcomeFile', maxCount: 1 },
      { name: 'paymentFile', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  async createCourse(
    @Body(BotIdExistsForPostsPipe) dto: CreateCourseDto,
    @UploadedFiles()
    files: CreateCourseUploadDto,
  ) {
    return await this.coursesService.createCourse(dto, files);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('list/:botId')
  @ApiConsumes('multipart/form-data')
  async getCourses(
    @Param('botId', BotIdExistsPipe, ParseIntPipe) botId: number,
  ) {
    return await this.coursesService.getCourses(botId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @ApiConsumes('multipart/form-data')
  async getCourse(@Param('id', CheckCoursesIdPipe, ParseIntPipe) id: number) {
    return await this.coursesService.getCourse(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'welcomeFile', maxCount: 1 },
      { name: 'paymentFile', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  async editCourse(
    @Body(TransferIdsToListPipe) dto: EditCourseDto,
    @Param('id', CheckCoursesIdPipe, ParseIntPipe) id: number,
    @UploadedFiles()
    files: CreateCourseUploadDto,
  ) {
    return await this.coursesService.editCourse(id, dto, files);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async deleteCourse(
    @Param('id', CheckCoursesIdPipe, ParseIntPipe) id: number,
  ) {
    await this.coursesService.deleteCourse(id);
    throw new StatusCodeException(HttpStatus.OK, 'Data successfully deleted');
  }
}
