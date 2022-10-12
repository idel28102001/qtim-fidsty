import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeleteResult,
  FindOneOptions,
  Repository,
  UpdateResult,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './entities/user.entity';
import { EditProfileDto } from './dto/edit.profile.dto';
import { ChangePasswordDto } from './dto/change.password.dto';
import { ChangeVerificationStatusDto } from './dto/change.verification.status.dto';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { BotEntity } from '../bots/entities/bot.entity';
import { UserPayloadInterface } from './interfaces/user.payload.interface';
import { UserRole } from '../users/enums/user.role.enum';
import { registrationStatus } from '../users/enums/registration.status.enum';
import { verificationStatus } from '../users/enums/verification.status.enum';
import { UserCenterTokensEnum } from './enum/users-center-tokens.enum';

@Injectable()
export class UsersCenterService {
  constructor(
    @Inject(UserCenterTokensEnum.USER_CENTER_REPOSITORY_TOKEN)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  get repo() {
    return this.userRepo;
  }

  async update(
    criteria: string | number,
    partialEntity: QueryDeepPartialEntity<UserEntity>,
  ): Promise<UpdateResult> {
    return await this.userRepo.update(criteria, partialEntity);
  }

  async findOwnersForAdmin(): Promise<UserEntity[]> {
    return await this.userRepo.find({ where: { role: UserRole.OWNER } });
  }

  async findManagersForAdmin(): Promise<UserEntity[]> {
    return await this.userRepo.find({ where: { role: UserRole.MANAGER } });
  }

  async findManagersForOwners(
    userPayload: UserPayloadInterface,
  ): Promise<UserEntity[]> {
    const user = await this.findOneByEmailWithOpts(userPayload.email, {
      relations: ['bots'],
      select: ['id'],
    });

    if (!user.bots.length) {
      return [];
    }

    const userBotsId = user.bots.map((bot) => bot.id);
    try {
      return await this.userRepo
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.bots_managers', 'bots_managers')
        .where('user.role = :role', {
          role: UserRole.MANAGER,
        })
        .andWhere('bots_managers.id IN (:...userBotsId)', { userBotsId })
        .getMany();
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async findManagerById(id: number): Promise<UserEntity> {
    try {
      return await this.userRepo.findOneOrFail({
        where: { id, role: UserRole.MANAGER },
        relations: ['bots_managers', 'bots_managers.posts'],
      });
    } catch (e) {
      throw new NotFoundException('Manager not found');
    }
  }

  async findOneByEmailAndPhone(
    email: string,
    phoneNumber: string,
  ): Promise<UserEntity> {
    try {
      return await this.userRepo.findOne({ where: { email, phoneNumber } });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async findOneByEmail(email: string): Promise<UserEntity> {
    return await this.userRepo.findOne({
      where: { email },
      relations: ['bots'],
    });
  }

  async findOneByEmailWithOpts(
    email: string,
    options?: FindOneOptions<UserEntity>,
  ): Promise<UserEntity> {
    return await this.userRepo.findOne({
      where: { email },
      ...options,
    });
  }

  async findOneByIdWithOpts(
    id: number,
    options?: FindOneOptions<UserEntity>,
  ): Promise<UserEntity> {
    const result = await this.userRepo.findOne({
      ...{ where: { id } },
      ...options,
    });
    if (!result) {
      throw new NotFoundException('Пользователь не найден');
    }
    return result;
  }

  async findOneWithOpts(options?: FindOneOptions<UserEntity>) {
    return await this.userRepo.findOne(options);
  }

  async findOneById(id: number): Promise<UserEntity> {
    return await this.userRepo.findOne({
      where: { id },
      relations: [
        'verificationFiles',
        'jwtRefreshToken',
        'bots',
        'bots_managers',
        'channels',
      ],
    });
  }

  create(data): UserEntity {
    return this.userRepo.create(data) as any as UserEntity;
  }

  async save(data): Promise<UserEntity> {
    return await this.userRepo.save(data);
  }

  async createUser(createUserDto: any, role): Promise<UserEntity> {
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const userEntity = this.userRepo.create({
      ...createUserDto,
      role,
      passwordHash,
    }) as any as UserEntity;
    try {
      return await this.userRepo.save(userEntity);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async saveRegisterToken(
    userId: number,
    confirmRegisterToken: string,
  ): Promise<void> {
    try {
      await this.userRepo.update(userId, { confirmRegisterToken });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async savePasswordCode(
    userId: number,
    recoverPasswordCode: string,
  ): Promise<void> {
    try {
      await this.userRepo.update(userId, { recoverPasswordCode });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async confirmRegister(userId: number): Promise<{ confirmation: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (user) {
      try {
        await this.userRepo.update(user.id, {
          registrationStatus: registrationStatus.ACTIVE,
          confirmRegisterToken: null,
        });
      } catch (e) {
        throw new BadRequestException(e);
      }

      return { confirmation: 'success' };
    }
  }

  async updateUserPassword(userId, password) {
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      await this.userRepo.update(userId, {
        passwordHash,
        recoverPasswordCode: null,
      });
      return { message: 'Пароль успешно сменен' };
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async getBotsForManagers(user): Promise<BotEntity[]> {
    const profile = await this.userRepo.findOne({
      where: { email: user.email },
      select: ['id', 'bots_managers'],
      relations: ['bots_managers', 'bots_managers.subscribers'],
    });
    return profile.bots_managers;
  }

  async editProfile(
    user: UserPayloadInterface,
    data: EditProfileDto,
  ): Promise<UserEntity> {
    const userData = await this.findOneByIdWithOpts(user.userId);

    const newData = {
      ...userData,
      ...data,
    };

    try {
      return await this.userRepo.save({
        ...newData,
      });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async editUser(
    id: number,
    user: UserPayloadInterface,
    data: EditProfileDto,
  ): Promise<UserEntity> {
    const userData = await this.findOneById(id);

    const newData = {
      ...userData,
      ...data,
    };

    try {
      return await this.userRepo.save({
        ...newData,
      });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async uploadUserImage(id: number, photo): Promise<UserEntity> {
    const userData = await this.findOneById(id);

    const editedProfile = {
      ...userData,
      photo: `/api/image/${photo.filename}`,
    };

    try {
      return await this.userRepo.save({
        ...editedProfile,
      });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async comparePassword(email: string, data: ChangePasswordDto) {
    const user = await this.findOneByEmailWithOpts(email, {
      select: ['passwordHash', 'id'],
    });
    const checkPassword = await bcrypt.compare(
      data.oldPassword,
      user.passwordHash,
    );

    if (checkPassword) {
      try {
        return await this.updateUserPassword(user.id, data.newPassword);
      } catch (e) {
        throw new BadRequestException(e);
      }
    }

    throw new BadRequestException('Wrong old password');
  }

  async verifyAccount(user: UserPayloadInterface): Promise<UserEntity> {
    const userData = await this.findOneByEmailWithOpts(user.email, {
      select: ['verificationStatus', 'id'],
    });

    userData.verificationStatus = verificationStatus.PENDING_VERIFICATION;

    try {
      return await this.userRepo.save(userData);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async changeVerificationStatus(
    data: ChangeVerificationStatusDto,
    id: number,
  ): Promise<UserEntity> {
    const user = await this.findOneById(id);
    const newData = {
      ...user,
      verificationStatus: data.status,
    };
    try {
      return await this.userRepo.save({
        ...newData,
      });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async deleteUser(id: number): Promise<DeleteResult> {
    try {
      return await this.userRepo.delete({ id });
    } catch (e) {
      throw new BadRequestException(e);
    }
  }
}
