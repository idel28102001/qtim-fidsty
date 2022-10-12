import { EditOneTimePostDto } from './one-time-posts/edit-one-time-post.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateBotPostDto extends EditOneTimePostDto {
  @ApiPropertyOptional()
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  @IsOptional()
  files: any[];
}
