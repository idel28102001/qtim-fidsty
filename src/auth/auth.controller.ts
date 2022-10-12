import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterManagerDto, RegisterOwnerDto } from './dto/register.user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ResetPasswordDto } from './dto/reset.password.dto';
import { UpdatePasswordDto } from './dto/update.password.dto';
import { JwtRefreshTokenDto } from './dto/jwt.refresh.token.dto';
import { TokenValidationPipe } from './pipes/refresh.validation.pipe';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../users/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { UserRole } from '../users/enums/user.role.enum';
import { SendCodeDto } from './dto/send.code.dto';
import { ExistEmailPipe } from '../users/pipes/exist.email.pipe';
import { ExistPhonePipe } from '../users/pipes/exist.phone.pipe';
import { UserPayload } from '../users/decorators/user.payload.decorator';
import { AbsenceEmailPipe } from '../users/pipes/absence.email.pipe';
import { StatusCodeException } from '../exception/status.code.exception';
import { CompareCodeDto } from './dto/compare.code.dto';
import { ConfirmPhoneDto } from './dto/confirm-code.dto';
import { UserEntity } from '../users-center/entities/user.entity';
import { UserPayloadInterface } from '../users-center/interfaces/user.payload.interface';
import { AuthTokensEnum } from './enums/tokens/auth.tokens.enum';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthTokensEnum.AUTH_SERVICE_TOKEN) private authService: AuthService,
  ) {}

  @Post('confirm-code')
  async confirmCode(@Body() data: ConfirmPhoneDto) {
    return await this.authService.confirmPhone(data);
  }

  @Get('confirm-register')
  @ApiQuery({ name: 'token', type: 'string' })
  async confirmRegister(@Query() { token }): Promise<{ confirmation: string }> {
    return await this.authService.confirmRegister(token);
  }

  @Post('send-code')
  async sendCode(@Body() data: SendCodeDto): Promise<HttpException> {
    return await this.authService.sendCode(data);
  }

  @Post('registration')
  async registration(
    @Body(ExistPhonePipe) createNewOwnerDto: RegisterOwnerDto,
  ): Promise<UserEntity> {
    return await this.authService.roleRegistration(
      createNewOwnerDto,
      UserRole.ADMIN,
    );
  }

  @Post('owner-registration')
  async ownerRegistration(
    @Body(ExistPhonePipe) createNewOwnerDto: RegisterOwnerDto,
  ): Promise<UserEntity> {
    return await this.authService.roleRegistration(
      createNewOwnerDto,
      UserRole.OWNER,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Post('manager-registration')
  async managerRegistration(
    @UserPayload() user: UserPayloadInterface,
    @Body(ExistEmailPipe) createNewManagerDto: RegisterManagerDto,
  ) {
    return await this.authService.managerRegistration(
      user,
      createNewManagerDto,
      UserRole.MANAGER,
    );
  }

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Req() req) {
    return await this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req): Promise<HttpException> {
    await this.authService.logout(req.user);
    throw new StatusCodeException(HttpStatus.OK, 'Logout successful');
  }

  @Post('refresh')
  async refresh(
    @Body(TokenValidationPipe) jwtRefreshTokenDto: JwtRefreshTokenDto,
  ) {
    const { refreshToken } = jwtRefreshTokenDto;
    return this.authService.refresh(refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(
    @Body(AbsenceEmailPipe) resetPasswordDto: ResetPasswordDto,
  ): Promise<HttpException> {
    await this.authService.resetPassword(resetPasswordDto);
    throw new StatusCodeException(HttpStatus.OK, 'Code has been sent');
  }

  @HttpCode(HttpStatus.OK)
  @Post('compare-code')
  async compareCode(@Body() data: CompareCodeDto): Promise<void> {
    const result = await this.authService.compareCode(data);
    if (result) {
      throw new StatusCodeException(HttpStatus.OK, 'Successfully');
    }
    throw new StatusCodeException(HttpStatus.CONFLICT, 'The code is incorrect');
  }

  @HttpCode(HttpStatus.OK)
  @Post('update-password')
  async updatePassword(
    @Body(AbsenceEmailPipe) updatePasswordDto: UpdatePasswordDto,
  ): Promise<HttpException> {
    const result = await this.authService.updatePassword(updatePasswordDto);
    if (result) {
      throw new StatusCodeException(
        HttpStatus.OK,
        'Password updated successfully',
      );
    }
    throw new StatusCodeException(HttpStatus.CONFLICT, 'The code is incorrect');
  }
}
