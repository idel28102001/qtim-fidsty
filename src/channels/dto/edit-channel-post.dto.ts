import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsMilitaryTime,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { getDate, getTime } from '../../utils/time.utils';

export class EditChannelPostDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
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

  @ApiProperty({ example: [1, 5] })
  @IsOptional()
  idsToDelete: number[];

  @ApiProperty()
  @IsOptional()
  files: any;
}
