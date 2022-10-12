import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterManagerDto, RegisterOwnerDto } from './dto/register.user.dto';
import * as bcrypt from 'bcrypt';
import * as random from 'randomstring';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { ResetPasswordDto } from './dto/reset.password.dto';
import { UpdatePasswordDto } from './dto/update.password.dto';
import { JwtRefreshTokenService } from './services/jwt.refresh.token.service';
import { UserRole } from '../users/enums/user.role.enum';
import { BotsService } from '../bots/services/bots.service';
import { Api } from 'telegram';
import { SendCodeDto } from './dto/send.code.dto';
import { registrationStatus } from '../users/enums/registration.status.enum';
import { TelegramService } from '../telegram/services/telegram.service';
import { ConfirmPhoneDto } from './dto/confirm-code.dto';
import { AuthEnum } from './enums/auth.enum';
import { UsersCenterService } from '../users-center/users-center.service';
import { UserEntity } from '../users-center/entities/user.entity';
import { UserPayloadInterface } from '../users-center/interfaces/user.payload.interface';
import { UserCenterTokensEnum } from '../users-center/enum/users-center-tokens.enum';
import { TelegramTokensEnum } from '../telegram/enum/telegram-tokens.enum';
import { BotsTokenEnum } from '../bots/enums/tokens/bots.token.enum';
import { JwtRefreshTokenTokensEnum } from './enums/tokens/Jwt-refresh-token.tokens.enum';

@Injectable()
export class AuthService {
  constructor(
    @Inject(UserCenterTokensEnum.USER_CENTER_SERVICE_TOKEN)
    private readonly usersCenterService: UsersCenterService,
    @Inject(BotsTokenEnum.BOTS_SERVICE_TOKEN)
    private readonly botsService: BotsService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @Inject(JwtRefreshTokenTokensEnum.JWT_REFRESH_TOKEN_SERVICE_TOKEN)
    private readonly jwtRefreshTokenService: JwtRefreshTokenService,
    @Inject(TelegramTokensEnum.TELEGRAM_SERVICE_TOKEN)
    private readonly telegramService: TelegramService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserEntity> {
    const user = await this.usersCenterService.findOneByEmailWithOpts(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.registrationStatus !== registrationStatus.ACTIVE) {
      throw new ConflictException('User not confirmed');
    }

    if (user.freezing) {
      throw new ForbiddenException('The user is temporarily frozen');
    }

    if (user) {
      const checkPassword = await bcrypt.compare(password, user.passwordHash);

      if (user && checkPassword) {
        return user;
      }
    }

    throw new UnauthorizedException('Password is invalid');
  }

  async sendCode(data: SendCodeDto): Promise<any> {
    const user = await this.usersCenterService.findOneWithOpts({
      where: { phoneNumber: data.phoneNumber },
      select: ['id', 'phoneNumber'],
    });
    const client = await this.telegramService.getTelegramClient();
    try {
      const { phoneCodeHash } = await client.sendCode(
        { apiId: client.apiId, apiHash: client.apiHash },
        data.phoneNumber,
      );
      await this.usersCenterService.save({
        ...user,
        phoneCodeHash,
        phoneNumber: data.phoneNumber,
        temporarySessionHash: client.session.save() as any as string,
      });
      return {
        status: HttpStatus.OK,
        message: 'Code sent successfully',
        phoneCodeHash,
      };
    } catch (e) {
      await client.disconnect();
      throw new BadRequestException(e);
    }
  }

  async roleRegistration(
    createUserDto: RegisterOwnerDto,
    role: UserRole,
  ): Promise<UserEntity> {
    const findUser = await this.usersCenterService.findOneWithOpts({
      where: { phoneNumber: createUserDto.phoneNumber },
      select: ['id'],
    });
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersCenterService.create({
      ...findUser,
      ...createUserDto,
      role,
      passwordHash,
    });
    try {
      const savedUser = await this.usersCenterService.save(user);
      await this.sendRegistrationMessage(savedUser);
      return user;
    } catch (e) {
      throw new BadRequestException('Ошибка регистрации. Попробуйте повторно');
    }
  }

  async managerRegistration(
    user: UserPayloadInterface,
    createNewManagerDto: RegisterManagerDto,
    role: UserRole,
  ) {
    try {
      const owner = await this.usersCenterService.findOneByIdWithOpts(
        user.userId,
        { select: ['id'], relations: ['bots'] },
      );
      const userData = await this.usersCenterService.createUser(
        createNewManagerDto,
        role,
      );
      userData.bots_managers = owner.bots;
      const result = await this.usersCenterService.save(userData);
      await this.sendRegistrationMessage(userData);
      return result;
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async sendRegistrationMessage(user: UserEntity) {
    const token = this.jwtService.sign(
      {
        userId: user.id,
      },
      { expiresIn: process.env.REGISTER_TOKEN_EXPIRES },
    );

    try {
      await this.usersCenterService.saveRegisterToken(user.id, token);
      await this.mailService.sendUserConfirmation(user, token);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async confirmPhone(data: ConfirmPhoneDto) {
    const { telegramCode, phoneNumber } = data;
    const user = await this.usersCenterService.findOneWithOpts({
      where: { phoneNumber },
      select: ['sessionHash', 'phoneCodeHash', 'temporarySessionHash', 'id'],
    });
    try {
      const client = await this.telegramService.getTelegramClient(
        user.temporarySessionHash,
        AuthEnum.Auth,
      );
      await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phoneNumber,
          phoneCodeHash: user.phoneCodeHash,
          phoneCode: telegramCode,
        }),
      );
      user.sessionHash = client.session.save() as any as string;
      return await this.usersCenterService.update(user.id, user);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async confirmRegister(token: string): Promise<{ confirmation: string }> {
    try {
      const { userId } = await this.jwtService.verify(token);

      return await this.usersCenterService.confirmRegister(userId);
    } catch {
      const res: any = await this.jwtService.decode(token);

      await this.usersCenterService.saveRegisterToken(res.userId, null);

      return { confirmation: 'expired' };
    }
  }

  async login(user: UserEntity) {
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.jwtRefreshTokenService.add(user);

    return {
      ...payload,
      accessToken,
      refreshToken,
    };
  }

  async logout(user): Promise<void> {
    try {
      const token = await this.jwtRefreshTokenService.findOneByUserId(
        user.userId,
      );
      if (token) {
        await this.jwtRefreshTokenService.removeOne(token);
      }
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  public async refresh(refreshToken): Promise<any> {
    const jwtRefreshToken = await this.jwtRefreshTokenService.findOne(
      refreshToken,
    );

    return await this.login(jwtRefreshToken.user);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    try {
      const user = await this.usersCenterService.findOneByEmailWithOpts(
        resetPasswordDto.email,
        { select: ['id', 'email'] },
      );
      const code = random.generate({ length: 6 });

      await this.usersCenterService.savePasswordCode(user.id, code);
      await this.mailService.sendResetPassword(user.email, code);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async compareCode(data: any): Promise<boolean> {
    try {
      const user = await this.usersCenterService.findOneByEmailWithOpts(
        data.email,
        { select: ['recoverPasswordCode', 'id'] },
      );
      if (user.recoverPasswordCode === data.code) {
        return true;
      }
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async updatePassword(updatePasswordDto: UpdatePasswordDto): Promise<boolean> {
    try {
      const user = await this.usersCenterService.findOneByEmailWithOpts(
        updatePasswordDto.email,
        { select: ['recoverPasswordCode', 'id', 'email'] },
      );
      if (user.recoverPasswordCode === updatePasswordDto.code) {
        await this.usersCenterService.updateUserPassword(
          user.id,
          updatePasswordDto.password,
        );
        await this.mailService.sendUpdatePassword(user.email);
        return true;
      }
    } catch (e) {
      throw new BadRequestException(e);
    }
  }
}
