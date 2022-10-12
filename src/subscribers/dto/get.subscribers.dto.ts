import { IsNotEmpty, IsNumberString } from 'class-validator';

export class GetSubscribersDto {
  @IsNotEmpty()
  @IsNumberString()
  public botId: string;
}
