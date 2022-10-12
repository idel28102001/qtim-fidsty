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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { Roles } from '../../users/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user.role.enum';
import { UserPayload } from '../../users/decorators/user.payload.decorator';
import { ChannelsService } from '../services/channels.service';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ExistChannelIdPipe } from '../pipes/exist.channelId.pipe';
import { UserPayloadInterface } from '../../users-center/interfaces/user.payload.interface';
import { AddedChannelIdPipe } from '../pipes/added.channelId.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageAndVideoFileFilter } from '../../utils/file-upload.utils';
import { CreateChannelDto } from '../dto/create-channel.dto';
import { EditChannelProfilePhotoDto } from '../dto/edit-channel-profile-photo.dto';
import { CheckFilePipe } from '../../media/pipes/check.file.pipe';
import { EditChannelDto } from '../dto/edit-channel.dto';
import { ChannelsTokensEnum } from '../enums/tokens/channels.tokens.enum';

@Controller('channels')
@ApiTags('Channels')
@Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
export class ChannelsController {
  constructor(
    @Inject(ChannelsTokensEnum.CHANNELS_SERVICE_TOKEN)
    private readonly channelsService: ChannelsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('create')
  @UseInterceptors(
    FileInterceptor('photo', {
      fileFilter: imageAndVideoFileFilter,
      limits: {
        fileSize: 4e7,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  async createChannel(
    @UserPayload() userPayload: UserPayloadInterface,
    @Body() dto: CreateChannelDto,
    @UploadedFile() photo,
  ) {
    return await this.channelsService.createChannel(dto, userPayload, photo);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/editProfilePhoto')
  @UseInterceptors(
    FileInterceptor('photo', {
      fileFilter: imageAndVideoFileFilter,
      limits: {
        fileSize: 4e7,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  async editChannelProfilePhoto(
    @UserPayload() userPayload: UserPayloadInterface,
    @Body() dto: EditChannelProfilePhotoDto,
    @UploadedFile(CheckFilePipe) photo,
    @Param('id', ParseIntPipe, ExistChannelIdPipe) channelId: number,
  ) {
    return await this.channelsService.editChannelProfilePhoto(
      userPayload,
      photo,
      channelId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put(':id')
  async editChannel(
    @Body() dto: EditChannelDto,
    @UserPayload() userPayload: UserPayloadInterface,
    @Param('id', ExistChannelIdPipe, ParseIntPipe) channelId: number,
  ) {
    return await this.channelsService.editChannel(channelId, dto, userPayload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async getChannel(
    @Param('id', ExistChannelIdPipe, ParseIntPipe)
    channelId: number,
  ) {
    return await this.channelsService.getChannel(channelId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/addAdmin/:username')
  async addAdmin(
    @Param('id', ExistChannelIdPipe, ParseIntPipe) channelId: number,
    @Param('username') username: string,
  ) {
    return await this.channelsService.addAdmin(channelId, username);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async getAllChannels(@UserPayload() userPayload: UserPayloadInterface) {
    return await this.channelsService.getAllChannels(userPayload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async deleteChannel(
    @UserPayload() userPayload: UserPayloadInterface,
    @Param('id', ExistChannelIdPipe, ParseIntPipe) channelId: number,
  ) {
    return await this.channelsService.deleteChannel(channelId, userPayload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id/remove')
  async removeFromDBChannel(
    @Param('id', ExistChannelIdPipe, ParseIntPipe) channelId: number,
  ) {
    return await this.channelsService.removeFromDBChannel(channelId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('add/:channelId')
  async addChannel(
    @UserPayload() userPayload: UserPayloadInterface,
    @Param('channelId', AddedChannelIdPipe) tgChannelId: string,
  ) {
    return await this.channelsService.addChannel(tgChannelId, userPayload);
  }
}
