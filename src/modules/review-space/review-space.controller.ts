import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewSpaceService } from './review-space.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import {
  ClientRoleGuard,
  ClientRoles,
} from 'src/common/guards/client-role.guard';
import { UserRole } from 'src/common/enums/common.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';

@Controller('review-space')
@ApiTags('Review Space')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class ReviewSpaceController {
  constructor(private readonly reviewSpaceService: ReviewSpaceService) {}

  @Post('/lessons/:lessonId')
  @ApiBearerAuth()
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Toggle lesson in review space (add/remove)' })
  async toggleLessonInReviewSpace(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.reviewSpaceService.toggleLessonInReviewSpace(lessonId, user.id);
  }
}
