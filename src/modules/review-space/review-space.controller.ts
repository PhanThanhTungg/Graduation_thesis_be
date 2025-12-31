import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
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
import { GetLessonReviewSettingsDto } from './dto/get-lesson-review-settings.dto';
import { UpdateLessonReviewSettingDto } from './dto/update-lesson-review-setting.dto';

@Controller('review-space')
@ApiTags('Review Space')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class ReviewSpaceController {
  constructor(private readonly reviewSpaceService: ReviewSpaceService) {}

  @Get('/lessons')
  @ApiBearerAuth()
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Get all lessons in review space' })
  async getLessonReviewSettings(
    @CurrentUser() user: currentClientUser,
    @Query() query: GetLessonReviewSettingsDto,
  ) {
    return this.reviewSpaceService.getLessonReviewSettings(
      user.id,
      query.page,
      query.limit,
      query.search,
    );
  }

  @Get('/lessons/:lessonId')
  @ApiBearerAuth()
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Get lesson review setting by lesson ID' })
  async getLessonReviewSettingByLessonId(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.reviewSpaceService.getLessonReviewSettingByLessonId(
      lessonId,
      user.id,
    );
  }

  @Patch('/lessons/:lessonId')
  @ApiBearerAuth()
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Update lesson review setting' })
  async updateLessonReviewSetting(
    @Param('lessonId') lessonId: string,
    @Body() updateDto: UpdateLessonReviewSettingDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.reviewSpaceService.updateLessonReviewSetting(
      lessonId,
      user.id,
      updateDto,
    );
  }

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
