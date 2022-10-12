import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersCenterService } from '../../users-center/users-center.service';
import { UserCenterTokensEnum } from '../../users-center/enum/users-center-tokens.enum';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    @Inject(UserCenterTokensEnum.USER_CENTER_SERVICE_TOKEN)
    private usersCenterService: UsersCenterService,
  ) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Unreachable code error
  async handleRequest(err, user) {
    const userData = await this.usersCenterService.findOneByIdWithOpts(
      user.userId,
    );
    if (userData && userData.freezing) {
      throw new ForbiddenException('The user is temporarily frozen');
    }
    return user;
  }
}
