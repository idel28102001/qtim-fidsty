import { ConfigService } from '@nestjs/config';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { DataSourceOptions } from 'typeorm';

export class Config {
  private config: ConfigService;

  constructor() {
    this.config = new ConfigService();
  }

  public get<T = any>(propertyPath: string, defaultValue?: T) {
    return this.config.get(propertyPath, defaultValue);
  }

  get isDevelopment() {
    return this.get<string>('NODE_ENV') === 'development';
  }

  public isProduction() {
    return this.get<string>('NODE_ENV') === 'production';
  }

  getFrontendUrl() {
    return this.get('FRONTEND_URL');
  }

  public getDatabaseOptions(): DataSourceOptions {
    return {
      type: 'postgres',
      host: this.get('POSTGRES_HOST'),
      port: Number(this.get('POSTGRES_PORT')),
      username: this.get('POSTGRES_USER'),
      password: this.get('POSTGRES_PASSWORD'),
      database: this.get('POSTGRES_DB'),
      entities: [__dirname + '/../**/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../**/**/*-migration{.ts,.js}'],
      synchronize: this.isDevelopment,
    };
  }

  getTelegramConfig() {
    return {
      apiId: parseInt(this.get<number>('TELEGRAM_API_ID')),
      apiHash: this.get<string>('TELEGRAM_API_HASH'),
    };
  }

  getJwtConfig() {
    return {
      secret: this.get('JWT_SECRET'),
      signOptions: { expiresIn: this.get('JWT_EXPIRES') },
    };
  }

  getJwtRefreshExpires() {
    return parseInt(this.get('JWT_REFRESH_EXPIRES', 9600));
  }

  getEmailOptions() {
    return {
      host: 'smtp.mail.ru',
      port: 465,
      secure: true,
      auth: {
        user: this.get('EMAIL_LOGIN'),
        pass: this.get('EMAIL_PASSWORD'),
      },
    };
  }

  get jwtConstants() {
    return {
      secret: process.env.JWT_SECRET,
    };
  }

  getFileStoreBotConfig() {
    return {
      adminPhone: this.get('TELEGRAM_ADMIN_PHONE'),
      botUsername: this.get('TELEGRAM_FILE_STORE_BOT_USERNAME'),
      botToken: this.get('TELEGRAM_FILE_STORE_BOT_TOKEN'),
    };
  }

  getUploadOptions(): MulterOptions {
    return {
      dest: '/tmp',
      limits: { fileSize: 50_000_000 }, // 50 Mb
    };
  }

  get registerJWT() {
    return {
      secret: this.jwtConstants.secret,
      signOptions: { expiresIn: this.get('JWT_SECRET_EXPIRES') },
    };
  }
}

export const config = new Config();
