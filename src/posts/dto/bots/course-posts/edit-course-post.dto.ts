import { IsOptional, IsString, Validate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsDelayValid } from '../../../decorators/is-delay-valid.decorotator';

export class EditCoursePostDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @Validate(IsDelayValid)
  delay: number;

  @ApiProperty({ example: [1, 5] })
  @IsOptional()
  idsToDelete: number[];

  @ApiProperty()
  atachedFiles: any;
}
