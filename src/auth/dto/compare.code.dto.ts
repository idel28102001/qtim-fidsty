import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CompareCodeDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  code: string;
}
