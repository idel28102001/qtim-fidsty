import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlockUserBotDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;
}
