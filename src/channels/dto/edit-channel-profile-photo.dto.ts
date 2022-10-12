import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class EditChannelProfilePhotoDto {
  @ApiPropertyOptional()
  @IsOptional()
  photo: any;
}
