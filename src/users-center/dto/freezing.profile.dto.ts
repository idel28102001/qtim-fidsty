import { IsBoolean, IsNotEmpty } from 'class-validator';

export class FreezingProfileDto {
  @IsNotEmpty()
  @IsBoolean()
  freezing: boolean;
}
