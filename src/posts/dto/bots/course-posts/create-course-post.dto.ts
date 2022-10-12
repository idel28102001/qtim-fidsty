import { ApiProperty } from '@nestjs/swagger';
import { IsString, Validate } from 'class-validator';
import { IsDelayValid } from '../../../decorators/is-delay-valid.decorotator';

export class CreateCoursePostDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @Validate(IsDelayValid)
  delay: number;

  @ApiProperty()
  attachedFiles: any;
}
