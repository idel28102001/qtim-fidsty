import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { DeleteResult, FindOneOptions } from 'typeorm';
import { EditProfileDto } from './dto/edit.profile.dto';
import { ChangePasswordDto } from './dto/change.password.dto';
import { MediaService } from '../media/services/media.service';
import { ChangeVerificationStatusDto } from './dto/change.verification.status.dto';
import { UserRole } from './enums/user.role.enum';
import { BotsService } from '../bots/services/bots.service';
import { verificationStatus } from './enums/verification.status.enum';
import { UsersCenterService } from '../users-center/users-center.service';
import { UserEntity } from '../users-center/entities/user.entity';
import { botStatus } from '../bots/enums/bot.status.enum';
import { AuthService } from '../auth/auth.service';
import { UserPayloadInterface } from '../users-center/interfaces/user.payload.interface';
import { UserCenterTokensEnum } from '../users-center/enum/users-center-tokens.enum';
import { MediaTokensEnum } from '../media/enums/tokens/media.tokens.enum';
import { BotsTokenEnum } from '../bots/enums/tokens/bots.token.enum';
import { AuthTokensEnum } from '../auth/enums/tokens/auth.tokens.enum';

@Injectable()
export class UsersService {
  constructor(
    @Inject(UserCenterTokensEnum.USER_CENTER_SERVICE_TOKEN)
    private readonly usersCenterService: UsersCenterService,
    @Inject(MediaTokensEnum.MEDIA_SERVICE_TOKEN)
    private readonly mediaService: MediaService,
    @Inject(BotsTokenEnum.BOTS_SERVICE_TOKEN)
    private readonly botsService: BotsService,
    @Inject(AuthTokensEnum.AUTH_SERVICE_TOKEN)
    private readonly authService: AuthService,
  ) {}

  async getUsersInfoByRole(userPayload: UserPayloadInterface): Promise<any> {
    if (userPayload.role === UserRole.ADMIN) {
      const owners = await this.findOwnersForAdmin();
      const managers = await this.findManagersForAdmin();
      const bots = await this.botsService.getBotsForAdmin();
      return {
        owners,
        managers,
        bots,
      };
    }
    if (userPayload.role === UserRole.OWNER) {
      const managers = await this.findManagersForOwners(userPayload);
      const bots = await this.botsService.getBotsForOwners(userPayload);
      return {
        managers,
        bots,
      };
    }
    if (userPayload.role === UserRole.MANAGER) {
      const bots = await this.botsService.getBotsForManagers(userPayload);
      return {
        bots,
      };
    }
  }

  async findOwnersForAdmin(): Promise<UserEntity[]> {
    return await this.usersCenterService.findOwnersForAdmin();
  }

  async findManagersForAdmin(): Promise<UserEntity[]> {
    return await this.usersCenterService.findManagersForAdmin();
  }

  async findManagersForOwners(
    userPayload: UserPayloadInterface,
  ): Promise<UserEntity[]> {
    return await this.usersCenterService.findManagersForOwners(userPayload);
  }

  async findManagerById(id: number): Promise<UserEntity> {
    return await this.usersCenterService.findManagerById(id);
  }

  async findOneById(id: number): Promise<UserEntity> {
    return await this.usersCenterService.findOneById(id);
  }

  async findOneByIdWithOpts(id: number, options?: FindOneOptions<UserEntity>) {
    return await this.usersCenterService.findOneByIdWithOpts(id, options);
  }

  create(data): UserEntity {
    return this.usersCenterService.create(data) as any as UserEntity;
  }

  async editProfile(
    user: UserPayloadInterface,
    data: EditProfileDto,
  ): Promise<UserEntity> {
    return await this.usersCenterService.editProfile(user, data);
  }

  async editUser(
    id: number,
    user: UserPayloadInterface,
    data: EditProfileDto,
  ): Promise<UserEntity> {
    return await this.usersCenterService.editUser(id, user, data);
  }

  async uploadUserImage(id: number, photo): Promise<UserEntity> {
    return await this.usersCenterService.uploadUserImage(id, photo);
  }

  async comparePassword(email: string, data: ChangePasswordDto) {
    return await this.usersCenterService.comparePassword(email, data);
  }

  async findOneByEmailWithOpts(email, options?: FindOneOptions<UserEntity>) {
    return await this.usersCenterService.findOneByEmailWithOpts(email, options);
  }

  async uploadVerifyFiles(
    user: UserPayloadInterface,
    files,
  ): Promise<UserEntity> {
    if (!files) {
      throw new BadRequestException('File should not be empty');
    }

    const userData = await this.findOneByEmailWithOpts(user.email, {
      relations: ['verificationFiles'],
    });

    if (
      userData.verificationStatus === verificationStatus.PENDING_VERIFICATION ||
      userData.verificationStatus === verificationStatus.VERIFIED
    ) {
      throw new BadRequestException(
        'Your verification request is being processed or has already been processed',
      );
    }

    if (userData.verificationFiles.length >= 2) {
      throw new BadRequestException('No more than two files are allowed');
    }

    userData.verificationFiles = [...userData.verificationFiles];

    for (const file of files) {
      const mediaFile = await this.mediaService.createDataMedia(file);
      userData.verificationFiles.push(mediaFile);
    }

    try {
      return await this.usersCenterService.save(userData);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async verifyAccount(user: UserPayloadInterface): Promise<UserEntity> {
    return await this.usersCenterService.verifyAccount(user);
  }

  async changeVerificationStatus(
    data: ChangeVerificationStatusDto,
    id: number,
  ): Promise<UserEntity> {
    return await this.usersCenterService.changeVerificationStatus(data, id);
  }

  async freezingUser(
    id: number,
    user: UserPayloadInterface,
    freezing: boolean,
  ): Promise<UserEntity> {
    const userData = await this.usersCenterService.findOneById(id);
    const userDataPayload = {
      userId: userData.id,
      email: userData.email,
      role: userData.role,
    };

    const editUser = async (id: number, data): Promise<UserEntity> => {
      const userData = await this.usersCenterService.findOneById(id);
      const editedUser = {
        ...userData,
        ...data,
      };
      try {
        return await this.usersCenterService.save({
          ...editedUser,
        });
      } catch (e) {
        throw new BadRequestException(e);
      }
    };

    if (
      user.role === UserRole.OWNER &&
      userDataPayload.role === UserRole.OWNER
    ) {
      throw new ConflictException('The owner cannot freeze the owner');
    }

    if (
      user.role === UserRole.OWNER &&
      userDataPayload.role === UserRole.MANAGER
    ) {
      const managers = await this.usersCenterService.findManagersForOwners(
        user,
      );
      const manager = managers.find(
        (manager) => manager.id === userDataPayload.userId,
      );
      if (!manager) {
        throw new ConflictException('Your manager with this id was not found');
      }
    }

    const managers = await this.usersCenterService.findManagersForOwners(
      userDataPayload,
    );

    if (managers.length) {
      for (const manager of managers) {
        await this.authService.logout({ userId: manager.id });
        await editUser(manager.id, { freezing });
      }
    }

    for (const bot of userData.bots) {
      await this.botsService.changeBotStatus(bot.id, {
        status: freezing ? botStatus.DEACTIVATED : botStatus.ACTIVATED,
      });
    }

    await this.authService.logout(userDataPayload);
    return await editUser(userData.id, { freezing });
  }

  async deleteUser(id: number): Promise<DeleteResult> {
    return await this.usersCenterService.deleteUser(id);
  }
}
