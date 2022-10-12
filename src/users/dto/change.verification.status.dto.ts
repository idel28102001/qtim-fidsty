import { IsEnum, IsNotEmpty } from 'class-validator';
import { verificationStatus } from '../enums/verification.status.enum';

export class ChangeVerificationStatusDto {
  @IsNotEmpty()
  @IsEnum(verificationStatus, {
    message:
      'status must be a valid enum value: NOT_CONFIRMED, PENDING_VERIFICATION, VERIFIED, DENIED',
  })
  public status: verificationStatus;
}
