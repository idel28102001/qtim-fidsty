import { Inject, NotFoundException, ValidationPipe } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UsersCenterService } from '../../users-center/users-center.service';
import { UserCenterTokensEnum } from '../../users-center/enum/users-center-tokens.enum';

export class ExistIdPipe extends ValidationPipe {
  constructor(
    @Inject(REQUEST) public request: any,
    @Inject(UserCenterTokensEnum.USER_CENTER_SERVICE_TOKEN)
    private readonly usersCenterService: UsersCenterService,
  ) {
    super({
      transform: true,
    });
  }

  async transform(id) {
    const user = await this.usersCenterService.findOneById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return id;
  }
}
