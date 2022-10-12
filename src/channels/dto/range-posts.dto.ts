import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class RangePostsDto {
  @ApiProperty({ example: '2022-07-16' })
  @IsDateString({}, { message: 'dateFrom должна быть вида гггг-мм-дд' })
  dateFrom: string;

  @ApiProperty({ example: '2022-08-16' })
  @IsDateString({}, { message: 'dateTo должна быть вида гггг-мм-дд' })
  dateTo: string;
}
