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
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserPayload } from '../decorators/user.payload.decorator';
import { UsersService } from '../users.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { EditProfileDto } from '../dto/edit.profile.dto';
import { ChangePasswordDto } from '../dto/change.password.dto';
import { ChangeVerificationStatusDto } from '../dto/change.verification.status.dto';
import { FilesUploadDto } from '../../media/dto/files.upload.dto';
import { UserRole } from '../enums/user.role.enum';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { editFileName, imageFileFilter } from '../../utils/file-upload.utils';
import { ExistIdPipe } from '../pipes/exist.id.pipe';
import { DataPipe } from '../pipes/data.pipe';
import { StatusCodeException } from '../../exception/status.code.exception';
import { FileUploadDto } from '../../media/dto/file.upload.dto';
import { CheckFilePipe } from '../../media/pipes/check.file.pipe';
import { UserEntity } from '../../users-center/entities/user.entity';
import { FreezingProfileDto } from '../dto/freezing.profile.dto';
import { UserPayloadInterface } from '../../users-center/interfaces/user.payload.interface';
import { UsersTokensEnum } from '../enums/users-tokens.enum';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(UsersTokensEnum.USERS_SERVICE_TOKEN)
    private readonly userService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @Get()
  async getUsersInfoByRole(
    @UserPayload() userPayload: UserPayloadInterface,
  ): Promise<any> {
    return await this.userService.getUsersInfoByRole(userPayload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Get('managers')
  async findManagersForOwners(
    @UserPayload() userPayload: UserPayloadInterface,
  ): Promise<UserEntity[]> {
    return await this.userService.findManagersForOwners(userPayload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @Get('profile')
  async getProfile(
    @UserPayload() user: UserPayloadInterface,
  ): Promise<UserEntity> {
    return await this.userService.findOneByIdWithOpts(user.userId, {
      relations: ['bots', 'bots_managers', 'verificationFiles'],
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('owner-content/:id')
  async viewOwnerContent(
    @Param('id', ParseIntPipe, ExistIdPipe) id: number,
  ): Promise<UserEntity> {
    return await this.userService.findOneById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Get('manager/:id')
  async findManagerById(@Param('id', ParseIntPipe, ExistIdPipe) id: number) {
    return await this.userService.findManagerById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Post('freezing/:id')
  async freezingUser(
    @Param('id', ParseIntPipe, ExistIdPipe) id: number,
    @Body() data: FreezingProfileDto,
    @UserPayload() user: UserPayloadInterface,
  ): Promise<UserEntity> {
    return await this.userService.freezingUser(id, user, data.freezing);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @Post('change-password')
  async comparePassword(
    @UserPayload() user: UserPayloadInterface,
    @Body() data: ChangePasswordDto,
  ) {
    return await this.userService.comparePassword(user.email, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @Post('upload-verify-files')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      storage: diskStorage({
        destination: './uploads',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 1e7,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: FilesUploadDto,
  })
  async uploadVerifyFiles(
    @UploadedFiles() files,
    @UserPayload() user: UserPayloadInterface,
  ): Promise<UserEntity> {
    return await this.userService.uploadVerifyFiles(user, files);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @Post('verify-account')
  async verifyAccount(
    @UserPayload() user: UserPayloadInterface,
  ): Promise<UserEntity> {
    return await this.userService.verifyAccount(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('change-verification-status/:id')
  async changeVerificationStatus(
    @Body() data: ChangeVerificationStatusDto,
    @Param('id', ParseIntPipe, ExistIdPipe) id: number,
  ): Promise<UserEntity> {
    return await this.userService.changeVerificationStatus(data, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: FileUploadDto,
  })
  async uploadUserImage(
    @Param('id', ParseIntPipe, ExistIdPipe) id: number,
    @UploadedFile(CheckFilePipe) file,
  ): Promise<UserEntity> {
    return this.userService.uploadUserImage(id, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @Put('update-profile')
  async editProfile(
    @Body(DataPipe) data: EditProfileDto,
    @UserPayload() user: UserPayloadInterface,
  ): Promise<UserEntity> {
    return await this.userService.editProfile(user, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Put(':id')
  async editUser(
    @Body(DataPipe) data: EditProfileDto,
    @Param('id', ParseIntPipe, ExistIdPipe) id: number,
    @UserPayload() user: UserPayloadInterface,
  ): Promise<UserEntity> {
    return await this.userService.editUser(id, user, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe, ExistIdPipe) id: number,
  ): Promise<HttpException> {
    await this.userService.deleteUser(id);
    throw new StatusCodeException(HttpStatus.OK, 'Data successfully deleted');
  }
}
