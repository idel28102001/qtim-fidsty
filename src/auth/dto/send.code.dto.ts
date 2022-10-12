import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class SendCodeDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  phoneNumber: string;
}
