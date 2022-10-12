import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class EditAboutBotDto {
  @ApiProperty()
  @IsNotEmpty()
  about: string;
}
