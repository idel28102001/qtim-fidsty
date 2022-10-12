import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsDateString, IsOptional } from 'class-validator';

export class PostsListDto {
  @ApiProperty()
  @IsOptional()
  @IsDateString()
  public dayPublic?: string;
}
