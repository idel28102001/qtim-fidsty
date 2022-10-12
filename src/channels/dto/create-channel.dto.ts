import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateChannelDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  about: string;

  @ApiProperty()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  photo: any;
}
