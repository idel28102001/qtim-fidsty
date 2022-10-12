import {
  Body,
  Controller,
  Delete,
  Get,
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
import { Roles } from '../../users/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user.role.enum';
import { ChannelsPostsService } from '../services/channels-posts.service';
import { ChannelsService } from '../services/channels.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { QueryInPeriodPipe } from '../pipes/query-in-period.pipe';
import { ExistChannelIdPipe } from '../pipes/exist.channelId.pipe';
import { QueryAtDayPipe } from '../pipes/query-at-day.pipe';
import { CheckChannelPostIdPipe } from '../pipes/check-channel-post-id.pipe';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { imageVideoFilter } from '../../utils/file-upload.utils';
import { ScheduleChannelPipe } from '../pipes/schedule.channel.pipe';
import { CreateChannelPostDto } from '../dto/create-channel-post.dto';
import { UploadFilesDto } from '../../posts/dto/upload.files.dto';
import { EditChannelPostDto } from '../dto/edit-channel-post.dto';
import { IsPostedPostPipe } from '../pipes/is-posted-post.pipe';
import { ChannelPostDto } from '../dto/channel-post.dto';
import { ChannelsPostsTokensEnum } from '../enums/tokens/channels-posts.tokens.enum';
import { ChannelsTokensEnum } from '../enums/tokens/channels.tokens.enum';

@ApiTags('Channel posts')
@Controller('channels/:channelId/posts')
@Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
export class ChannelsPostsController {
  constructor(
    @Inject(ChannelsPostsTokensEnum.CHANNELS_POSTS_SERVICE_TOKEN)
    private readonly channelsPostsService: ChannelsPostsService,
    @Inject(ChannelsTokensEnum.CHANNELS_SERVICE_TOKEN)
    private readonly channelsService: ChannelsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('inPeriod')
  @ApiConsumes('application/json')
  async getPostsInPeriod(
    @Query(QueryInPeriodPipe) query,
    @Param('channelId', ExistChannelIdPipe, ParseIntPipe) channelId: number,
  ) {
    return await this.channelsPostsService.getPostsInPeriod(channelId, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('atDay')
  @ApiConsumes('application/json')
  async getPostsAtDay(
    @Query(QueryAtDayPipe) query,
    @Param('channelId', ExistChannelIdPipe, ParseIntPipe) channelId: number,
  ) {
    const channel = await this.channelsService.getLittleInfo(channelId);
    return await this.channelsPostsService.getPostsAtDay(channel, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':postId')
  @ApiConsumes('application/json')
  async getPost(
    @Param(CheckChannelPostIdPipe)
    data: ChannelPostDto,
  ) {
    const channel = await this.channelsService.getLittleInfo(data.channelId);
    return await this.channelsPostsService.getPost(channel, data.postId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files', maxCount: 10 }], {
      limits: {
        fileSize: 4e7,
        files: 11,
      },
      fileFilter: imageVideoFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  async createPost(
    @Body(ScheduleChannelPipe) data: CreateChannelPostDto,
    @UploadedFiles() files: UploadFilesDto,
    @Param('channelId', ExistChannelIdPipe, ParseIntPipe) channelId: number,
  ) {
    const channel = await this.channelsService.getLittleInfo(channelId);
    return await this.channelsPostsService.createChannelPost(
      channel,
      data,
      files,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':postId')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files', maxCount: 10 }], {
      limits: {
        fileSize: 4e7,
        files: 11,
      },
      fileFilter: imageVideoFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  async editPost(
    @Body(ScheduleChannelPipe)
    data: EditChannelPostDto,
    @Param(CheckChannelPostIdPipe)
    chanPost: ChannelPostDto,
    @Param('postId', IsPostedPostPipe, ParseIntPipe)
    postId: number,
    @UploadedFiles() files: UploadFilesDto,
  ) {
    const channel = await this.channelsService.getLittleInfo(
      chanPost.channelId,
    );
    return await this.channelsPostsService.editChannelPost(
      channel,
      chanPost.postId,
      data,
      files,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':postId')
  async deletePost(
    @Param(CheckChannelPostIdPipe)
    chanPost: ChannelPostDto,
    @Param('postId', IsPostedPostPipe, ParseIntPipe)
    postId: number,
  ) {
    const channel = await this.channelsService.getLittleInfo(
      chanPost.channelId,
    );
    return await this.channelsPostsService.deletePost(channel, chanPost.postId);
  }
}
