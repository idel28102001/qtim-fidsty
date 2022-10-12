import {
  IsArray,
  IsNumber,
  IsNumberString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UploadFilesDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files: any[];

  @ApiPropertyOptional()
  @IsNumberString({}, { each: true })
  @IsOptional()
  mediaId: string[];
}
