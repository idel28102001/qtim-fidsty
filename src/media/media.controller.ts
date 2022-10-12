import {
  Controller,
  Delete,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MediaService } from './services/media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckIdPipe } from './pipes/check.id.pipe';
import { StatusCodeException } from '../exception/status.code.exception';
import { UserRole } from '../users/enums/user.role.enum';
import { Roles } from '../users/decorators/roles.decorator';
import { RolesGuard } from '../users/guards/roles.guard';
import { MediaTokensEnum } from './enums/tokens/media.tokens.enum';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(
    @Inject(MediaTokensEnum.MEDIA_SERVICE_TOKEN)
    private readonly mediaService: MediaService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @Delete(':id')
  async deleteMedia(
    @Param('id', ParseIntPipe, CheckIdPipe) id: number,
  ): Promise<HttpException> {
    await this.mediaService.deleteMedia(id);
    throw new StatusCodeException(HttpStatus.OK, 'Data successfully deleted');
  }
}
