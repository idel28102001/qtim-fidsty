import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { CURRS } from '../../../../utils/constants';
import { IsCostValid } from '../../../decorators/is-cost-valid.decorotator';

export class CreateCourseDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  botId: number;

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

  @ApiProperty()
  @IsOptional()
  welcomeFile?: any;

  @ApiProperty()
  @IsOptional()
  paymentFile?: any;
}
