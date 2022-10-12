import {
  BadRequestException,
  Inject,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { JwtRefreshTokenService } from '../services/jwt.refresh.token.service';
import { JwtRefreshTokenDto } from '../dto/jwt.refresh.token.dto';
import { JwtRefreshTokenTokensEnum } from '../enums/tokens/Jwt-refresh-token.tokens.enum';

@Injectable()
export class TokenValidationPipe implements PipeTransform<JwtRefreshTokenDto> {
  constructor(
    @Inject(JwtRefreshTokenTokensEnum.JWT_REFRESH_TOKEN_SERVICE_TOKEN)
    private readonly jwtRefreshTokenService: JwtRefreshTokenService,
  ) {}

  async transform(
    jwtRefreshToken: JwtRefreshTokenDto,
  ): Promise<JwtRefreshTokenDto> {
    const { refreshToken } = jwtRefreshToken;
    const getJwtRefreshToken = await this.jwtRefreshTokenService.findOne(
      refreshToken,
    );

    if (!getJwtRefreshToken) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Некорректный refreshToken.',
      });
    }

    return jwtRefreshToken;
  }
}
