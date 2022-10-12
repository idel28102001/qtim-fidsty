import { IsNotEmpty, IsOptional, IsString, Validate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsCostValid } from '../../../decorators/is-cost-valid.decorotator';

export class EditOneTimePostDto {
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
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ example: [1, 5] })
  @IsOptional()
  idsToDelete: number[];

  @ApiProperty()
  @IsOptional()
  previewFile: any;

  @ApiProperty()
  spoilerFiles: any;
}
