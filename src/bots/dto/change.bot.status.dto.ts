import { IsEnum, IsNotEmpty } from 'class-validator';
import { botStatus } from '../enums/bot.status.enum';

export class ChangeBotStatusDto {
  @IsNotEmpty()
  @IsEnum(botStatus, {
    message: 'status must be a valid enum value: ACTIVATED or DEACTIVATED',
  })
  public status: botStatus;
}
