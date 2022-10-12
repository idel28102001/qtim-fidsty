import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class DayPostsDto {
  @ApiProperty({ example: '2022-07-16' })
  @IsDateString({}, { message: 'day должна быть вида гггг-мм-дд' })
  day: string;
}
