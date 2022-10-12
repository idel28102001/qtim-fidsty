import { IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PostsCountDto {
  @ApiProperty()
  @IsOptional()
  @IsDateString()
  public publicAt?: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  public publicTo?: string;
}
