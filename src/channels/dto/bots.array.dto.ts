import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNumber } from 'class-validator';

export class BotsArrayDto {
  @ApiProperty()
  @IsNumber({}, { each: true })
  botIds: number[];
}
