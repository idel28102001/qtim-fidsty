import { IsDateString, IsOptional, IsString } from 'class-validator';

export class EditProfileDto {
  @IsOptional()
  @IsString()
  public name: string;

  @IsOptional()
  @IsString()
  public surname: string;

  @IsOptional()
  @IsString()
  public country: string;

  @IsOptional()
  @IsDateString()
  public dateOfBirth: string;
}
