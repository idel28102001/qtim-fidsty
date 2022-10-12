import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsPhoneNumber } from 'class-validator';

export class ConfirmPhoneDto {
  @ApiProperty()
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  telegramCode: string;
}
