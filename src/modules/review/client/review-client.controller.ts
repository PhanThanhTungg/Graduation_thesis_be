import { 
  Body, 
  Controller, 
  Get,
  Param, 
  Patch, 
  Post,
  Query, 
  UseGuards 
} from '@nestjs/common';
import { ReviewService } from './review-client.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { CreateReviewDto, CreateReviewReplyDto, UpdateReviewDto } from './dto/review.dto';

@Controller('review')
@ApiTags('Client / Review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('course/:courseId')
  @UseGuards(AuthGuard('client-jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a review for a course',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The UUID of the course to review',
    example: 'uuid-string',
  })
  async createReview(
    @Param('courseId') courseId: string,
    @CurrentUser() user: currentClientUser,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewService.createReview(courseId, user, createReviewDto);
  }

  @Patch('course/:courseId')
  @UseGuards(AuthGuard('client-jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update your review for a course',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The UUID of the course',
    example: 'uuid-string',
  })
  async updateReview(
    @Param('courseId') courseId: string,
    @CurrentUser() user: currentClientUser,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewService.updateReview(courseId, user, updateReviewDto);
  }

  @Get('course/:courseId/overview')
  @ApiOperation({
    summary: 'Get rating overview statistics for a course (Public)',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The UUID of the course',
    example: 'uuid-string',
  })
  async getRatingOverview(@Param('courseId') courseId: string) {
    return this.reviewService.getRatingOverview(courseId);
  }

  @Get('course/:courseId')
  @ApiOperation({
    summary: 'Get reviews and replies for a course with filtering (Public)',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The UUID of the course',
    example: 'uuid-string',
  })
  async getCourseReviews(
    @Param('courseId') courseId: string,
    @Query('rating') rating?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewService.getCourseReviews(
      courseId,
      rating ? parseInt(rating) : undefined,
      limit ? parseInt(limit) : 4,
    );
  }

  @Post(':reviewId/reply')
  @UseGuards(AuthGuard('client-jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reply to a review',
  })
  @ApiParam({
    name: 'reviewId',
    description: 'The UUID of the review to reply to',
    example: 'uuid-string',
  })
  async createReviewReply(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: currentClientUser,
    @Body() createReviewReplyDto: CreateReviewReplyDto,
  ) {
    return this.reviewService.createReviewReply(reviewId, user, createReviewReplyDto);
  }
}
