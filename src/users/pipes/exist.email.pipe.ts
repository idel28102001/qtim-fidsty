import { ConflictException, Inject, ValidationPipe } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UsersCenterService } from '../../users-center/users-center.service';
import { UserCenterTokensEnum } from '../../users-center/enum/users-center-tokens.enum';

export class ExistEmailPipe extends ValidationPipe {
  constructor(
    @Inject(REQUEST) public request: any,
    @Inject(UserCenterTokensEnum.USER_CENTER_SERVICE_TOKEN)
    private readonly usersCenterService: UsersCenterService,
  ) {
    super({
      transform: true,
    });
  }

  async transform(data) {
    const user = await this.usersCenterService.findOneByEmailWithOpts(
      data.email,
      { select: ['id'] },
    );

    if (user) {
      throw new ConflictException('User is exist');
    }

    return data;
  }
}
