import {
  BadRequestException,
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
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BotsService } from '../services/bots.service';
import { CreateBotDto } from '../dto/create.bot.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { EditBotDto } from '../dto/edit.bot.dto';
import { StatusIdPipe } from '../pipes/status.id.pipe';
import { UserPayload } from '../../users/decorators/user.payload.decorator';
import { RolesGuard } from '../../users/guards/roles.guard';
import { Roles } from '../../users/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user.role.enum';
import { BotEntity } from '../entities/bot.entity';
import { imageFileFilter } from '../../utils/file-upload.utils';
import { UsernamePipe } from '../pipes/username.pipe';
import { BotIdExistsPipe } from '../pipes/bot-id-exists-pipe';
import { ChangeBotStatusDto } from '../dto/change.bot.status.dto';
import { BlockUserBotDto } from '../dto/block-user.bot.dto';
import { EditAboutBotDto } from '../dto/edit-about.bot.dto';
import { UserPayloadInterface } from '../../users-center/interfaces/user.payload.interface';
import { BotUsernameExistsPipe } from '../pipes/bot-username-exists-pipe';
import { BotsTokenEnum } from '../enums/tokens/bots.token.enum';

@ApiTags('Bots')
@Controller('bots')
export class BotsController {
  constructor(
    @Inject(BotsTokenEnum.BOTS_SERVICE_TOKEN) private botService: BotsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Get()
  async getBotsForOwners(@UserPayload() user: UserPayloadInterface) {
    try {
      return await this.botService.getBotsForOwners(user);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Post('addByUsername/:username')
  async addByUsername(
    @UserPayload() user: UserPayloadInterface,
    @Param('username', BotUsernameExistsPipe) username: string,
  ) {
    return await this.botService.addByUsername(user, username);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Post('add/:token')
  async addExistsBot(
    @UserPayload() user: UserPayloadInterface,
    @Param('token') token: string,
  ) {
    return await this.botService.addBot(user, token);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Delete('remove/:id')
  async removeBot(@Param('id', ParseIntPipe, BotIdExistsPipe) id: number) {
    return await this.botService.removeBot(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Get(':id')
  async findBotById(@Param('id', ParseIntPipe, BotIdExistsPipe) id: number) {
    return await this.botService.getBotById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create Bot',
    type: CreateBotDto,
  })
  async createBot(
    @Body(UsernamePipe) data: CreateBotDto,
    @UserPayload() userPayload: UserPayloadInterface,
    @UploadedFile() file,
  ) {
    return await this.botService.createBot(data, userPayload, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Post('bot-status/:id')
  async changeBotStatus(
    @Param('id', ParseIntPipe, BotIdExistsPipe) id: number,
    @Body() data: ChangeBotStatusDto,
  ): Promise<BotEntity> {
    return await this.botService.changeBotStatus(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Put(':id/about')
  async editBotAbout(
    @Param('id', ParseIntPipe, BotIdExistsPipe) id: number,
    @Body() data: EditAboutBotDto,
  ) {
    return await this.botService.editBotAbout(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Post('primary/:id')
  async changePrimaryBot(
    @Param('id', ParseIntPipe, BotIdExistsPipe) id: number,
  ): Promise<BotEntity> {
    return await this.botService.changePrimaryBot(id);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  // @Post(':id/welcome-message-file')
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     fileFilter: imageAndVideoFileFilter,
  //     limits: {
  //       fileSize: 4e7,
  //       files: 1,
  //     },
  //   }),
  // )
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   type: FileUploadDto,
  // })
  // async addWelcomeMessageFile(
  //   @Param('id', ParseIntPipe, StatusIdPipe) id: number,
  //   @UserPayload() user: UserPayloadInterface,
  //   @UploadedFile() file,
  // ) {
  //   return await this.botService.addWelcomeMessageFile(id, user, file);
  // }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  async editBot(
    @Param('id', ParseIntPipe, BotIdExistsPipe) id: number,
    @Body() data: EditBotDto,
    @UserPayload() user: UserPayloadInterface,
    @UploadedFile() file,
  ) {
    return await this.botService.editBot(id, data, user, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Delete(':id')
  async deleteBot(
    @UserPayload() user: UserPayloadInterface,
    @Param('id', ParseIntPipe, StatusIdPipe) id: number,
  ) {
    return await this.botService.deleteBot(user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Post(':id/block')
  async blockUser(
    @Param('id', ParseIntPipe, StatusIdPipe) id: number,
    @Body() data: BlockUserBotDto,
  ) {
    return await this.botService.blockSub(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Post(':id/unblock')
  async unblockUser(
    @Param('id', ParseIntPipe, StatusIdPipe) id: number,
    @Body() data: BlockUserBotDto,
  ) {
    return await this.botService.unblockSub(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @Get(':id/subscribers')
  async getSubscribersByBot(
    @Param('id', ParseIntPipe, StatusIdPipe) id: number,
  ) {
    return await this.botService.getSubscribersByBot(id);
  }
}
