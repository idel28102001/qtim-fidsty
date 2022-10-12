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

export class CreateOneTimePostDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  botId: number;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  previewDescription: string;

  @ApiProperty({ example: 200 })
  @Validate(IsCostValid)
  cost: number;

  @ApiProperty({ example: 'USD' })
  @IsIn(CURRS)
  currency: string;

  @ApiProperty()
  @IsOptional()
  previewFile: any;

  @ApiProperty()
  spoilerFiles: any;
}
