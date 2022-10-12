import { Module } from '@nestjs/common';
import { DatabaseProvider } from './database.provider';
import { DATABASE_SOURCE_TOKEN } from './databse.constant';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [DatabaseProvider, ConfigService],
  exports: [DatabaseProvider, DATABASE_SOURCE_TOKEN],
})
export class DatabaseModule {}
