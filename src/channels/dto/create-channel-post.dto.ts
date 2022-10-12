import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsMilitaryTime,
  IsOptional,
  IsString,
} from 'class-validator';
import { getDate, getTime } from '../../utils/time.utils';

export class CreateChannelPostDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  public datePublic = getDate(new Date());

  @ApiPropertyOptional()
  @IsOptional()
  @IsMilitaryTime()
  public timePublic = getTime(new Date());

  @ApiPropertyOptional()
  @IsOptional()
  files: any[];
}
