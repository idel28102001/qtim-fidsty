import { UserRole } from '../../users/enums/user.role.enum';

export interface UserPayloadInterface {
  userId: number;
  email: string;
  role: UserRole;
}
