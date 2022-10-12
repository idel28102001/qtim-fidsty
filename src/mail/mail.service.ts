import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { UserEntity } from '../users-center/entities/user.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(user: UserEntity, token: string) {
    const url = `${process.env.HOST_URL}/api/auth/confirm-register?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Подтверждение регистрации',
      template: '/templates/confirmation-register',
      context: {
        url,
      },
    });
  }

  async sendResetPassword(email: string, code: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Восстановление пароля',
      template: '/templates/reset-password',
      context: {
        code,
      },
    });
  }

  async sendUpdatePassword(email: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Обновление пароля',
      template: '/templates/update-password',
    });
  }
}
