import { ConflictException, Inject, ValidationPipe } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UsersCenterService } from '../../users-center/users-center.service';
import { UserCenterTokensEnum } from '../../users-center/enum/users-center-tokens.enum';

export class ExistPhonePipe extends ValidationPipe {
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
    const user = await this.usersCenterService.findOneByEmailAndPhone(
      data.email,
      data.phoneNumber,
    );

    if (user) {
      throw new ConflictException('User is exist');
    }

    return data;
  }
}
