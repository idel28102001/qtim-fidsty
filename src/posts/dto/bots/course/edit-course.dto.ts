import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Validate } from 'class-validator';
import { CURRS } from '../../../../utils/constants';
import { IsCostValid } from '../../../decorators/is-cost-valid.decorotator';

export class EditCourseDto {
  @ApiProperty({ example: 'Марафон желаний' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Привет' })
  @IsString()
  welcomeMessage: string;

  @ApiProperty({ example: 'Вы купили' })
  @IsString()
  paymentMessage: string;

  @ApiProperty({ example: 300 })
  @Validate(IsCostValid)
  cost: number;

  @ApiProperty({ example: 'USD' })
  @IsIn(CURRS)
  currency: string;

  @ApiProperty({ example: [1, 5] })
  @IsOptional()
  idsToDelete: number[];

  @ApiProperty()
  @IsOptional()
  welcomeFile?: any;

  @ApiProperty()
  @IsOptional()
  paymentFile?: any;
}
