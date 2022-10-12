import {
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/users/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user.role.enum';
import { AllPostsService } from '../services/all-posts.service';
import { RolesGuard } from '../../users/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BotIdExistsPipe } from '../../bots/pipes/bot-id-exists-pipe';
import { QueryLimitOffsetPipe } from '../pipes/query-limit-offset.pipe';
import { AllKindPostsTokensEnum } from '../enums/tokens/all-kind-posts.tokens.enum';

@ApiTags('Bot All Posts')
@Controller('posts')
@Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
export class AllKindPostsController {
  constructor(
    @Inject(AllKindPostsTokensEnum.ALLKINDPOSTS_SERVICE_TOKEN)
    private allkindPosts: AllPostsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('counts/:botId')
  async getPostsCount(
    @Param('botId', BotIdExistsPipe, ParseIntPipe) botId: number,
  ) {
    return await this.allkindPosts.getPostsCount(botId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('all/:botId')
  async getPosts(
    @Query(QueryLimitOffsetPipe) query,
    @Param('botId', BotIdExistsPipe, ParseIntPipe) botId: number,
  ) {
    return await this.allkindPosts.getAllPosts(botId, query);
  }
}
