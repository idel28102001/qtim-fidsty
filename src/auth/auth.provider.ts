import { Provider } from '@nestjs/common';
import { DATABASE_SOURCE_TOKEN } from '../database/databse.constant';
import { DataSource } from 'typeorm';
import { JwtRefreshTokenTokensEnum } from './enums/tokens/Jwt-refresh-token.tokens.enum';
import { JwtRefreshToken } from './entities/jwt.refresh.entity';
import { AuthTokensEnum } from './enums/tokens/auth.tokens.enum';
import { LocalStrategyTokensEnum } from './enums/tokens/local-strategy.tokens.enum';
import { JwtStrategyTokensEnum } from './enums/tokens/Jwt-strategy.tokens.enum';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtRefreshTokenService } from './services/jwt.refresh.token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

export const AuthProvider: Provider[] = [
  {
    provide: AuthTokensEnum.AUTH_SERVICE_TOKEN,
    useClass: AuthService,
  },
  {
    provide: LocalStrategyTokensEnum.LOCAL_STRATEGY_TOKEN,
    useClass: LocalStrategy,
  },
  {
    provide: JwtRefreshTokenTokensEnum.JWT_REFRESH_TOKEN_SERVICE_TOKEN,
    useClass: JwtRefreshTokenService,
  },
  {
    provide: JwtStrategyTokensEnum.JWT_STRATEGY_TOKEN,
    useClass: JwtStrategy,
  },

  {
    provide: JwtRefreshTokenTokensEnum.JWT_REFRESH_REPOSITORY,
    inject: [DATABASE_SOURCE_TOKEN],
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(JwtRefreshToken),
  },
];
