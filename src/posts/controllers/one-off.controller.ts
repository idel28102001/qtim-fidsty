import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/users/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user.role.enum';
import { RolesGuard } from '../../users/guards/roles.guard';
import { imageVideoFilter } from '../../utils/file-upload.utils';
import { CreateOneTimePostDto } from '../dto/bots/one-time-posts/create-one-time-post.dto';
import { FilesContentDto } from '../../media/dto/files.content.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OneoffpostsService } from '../services/posts/oneoffposts.service';
import { BotIdExistsForPostsPipe } from '../pipes/bot-id-exists-for-posts-pipe';
import { CheckOneOffIdPipe } from '../pipes/check-one-off-id.pipe';
import { EditOneTimePostDto } from '../dto/bots/one-time-posts/edit-one-time-post.dto';
import { StatusCodeException } from '../../exception/status.code.exception';
import { BotIdExistsPipe } from '../../bots/pipes/bot-id-exists-pipe';
import { QueryLimitOffsetPipe } from '../pipes/query-limit-offset.pipe';
import { OneOffPostsTokensEnum } from '../enums/tokens/one-off-posts.tokens.enum';

@ApiTags('Bot One Time Posts')
@Controller('posts/one-off/')
@Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
export class OneOffController {
  constructor(
    @Inject(OneOffPostsTokensEnum.ONEOFF_SERVICE_TOKEN)
    private oneTimePostsService: OneoffpostsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('list/:botId')
  async getPosts(
    @Param('botId', BotIdExistsPipe, ParseIntPipe) botId: number,
    @Query(QueryLimitOffsetPipe) query,
  ) {
    return await this.oneTimePostsService.getAllPosts(botId, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async getPostById(@Param('id', ParseIntPipe, CheckOneOffIdPipe) id: number) {
    return await this.oneTimePostsService.getOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'previewFile', maxCount: 1 },
        { name: 'spoilerFiles', maxCount: 10 },
      ],
      {
        fileFilter: imageVideoFilter,
        limits: {
          fileSize: 4e7,
          files: 11,
        },
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  async createPost(
    @Body(BotIdExistsForPostsPipe) data: CreateOneTimePostDto,
    @UploadedFiles()
    files: FilesContentDto,
  ) {
    return await this.oneTimePostsService.createBotPost(data, files);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'previewFile', maxCount: 1 },
        { name: 'spoilerFiles', maxCount: 10 },
      ],
      {
        fileFilter: imageVideoFilter,
        limits: {
          fileSize: 4e7,
          files: 11,
        },
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  async editPost(
    @Param('id', ParseIntPipe, CheckOneOffIdPipe) id: number,
    @Body() data: EditOneTimePostDto,
    @UploadedFiles()
    files: FilesContentDto,
  ) {
    return await this.oneTimePostsService.editPost(id, data, files);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async deletePost(
    @Param('id', ParseIntPipe, CheckOneOffIdPipe) id: number,
  ): Promise<HttpException> {
    await this.oneTimePostsService.deletePost(id);
    throw new StatusCodeException(HttpStatus.OK, 'Data successfully deleted');
  }
}
