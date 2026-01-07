import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import {
  CreateReviewDto,
  CreateReviewReplyDto,
  UpdateReviewDto,
} from './dto/review.dto';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { successResponse } from 'src/common/interfaces/response.interface';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(
    courseId: string,
    user: currentClientUser,
    dto: CreateReviewDto,
  ) {
    try {
      // Use transaction to create review and update course rating atomically
      const result = await this.prisma.$transaction(async (tx) => {
        // Check if course exists and get current rating data in one query
        const course = await tx.course.findUnique({
          where: { id: courseId, deletedAt: null },
          select: { id: true },
        });

        if (!course) {
          throw new NotFoundException('Course not found');
        }

        // Check if user has purchased the course
        const purchase = await tx.order.findFirst({
          where: {
            userId: user.id,
            courseId: courseId,
            status: 'success',
          },
        });

        if (!purchase) {
          throw new ForbiddenException(
            'You must purchase this course before leaving a review',
          );
        }

        // Create review - unique constraint will throw error if already exists
        const review = await tx.review.create({
          data: {
            userId: user.id,
            courseId: courseId,
            rating: dto.rating,
            comment: dto.comment,
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        });

        // Calculate and update course rating in same transaction
        const avgResult = await tx.review.aggregate({
          where: { courseId },
          _avg: { rating: true },
        });

        const avgRating = avgResult._avg.rating || 0;

        await tx.course.update({
          where: { id: courseId },
          data: {
            rating: Math.round(avgRating * 10) / 10,
          },
        });

        return review;
      });

      const response: successResponse = {
        message: 'Review created successfully',
        data: result,
      };
      return response;
    } catch (error) {
      // Handle unique constraint violation (P2002)
      if (error.code === 'P2002') {
        throw new BadRequestException('You have already reviewed this course.');
      }
      throw error;
    }
  }

  /**
   * Update an existing review
   * Only the review owner can update their review
   */
  async updateReview(
    courseId: string,
    user: currentClientUser,
    dto: UpdateReviewDto,
  ) {
    try {
      // Use transaction to update review and course rating atomically
      const result = await this.prisma.$transaction(async (tx) => {
        // Update review using unique compound key - will throw if not found
        const updatedReview = await tx.review.update({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId: courseId,
            },
          },
          data: {
            ...(dto.rating !== undefined && { rating: dto.rating }),
            ...(dto.comment !== undefined && { comment: dto.comment }),
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        });

        // Update course rating if rating changed
        if (dto.rating !== undefined) {
          const avgResult = await tx.review.aggregate({
            where: { courseId },
            _avg: { rating: true },
          });

          const avgRating = avgResult._avg.rating || 0;

          await tx.course.update({
            where: { id: courseId },
            data: {
              rating: Math.round(avgRating * 10) / 10,
            },
          });
        }

        return updatedReview;
      });

      const response: successResponse = {
        message: 'Review updated successfully',
        data: result,
      };
      return response;
    } catch (error) {
      // Handle record not found (P2025)
      if (error.code === 'P2025') {
        throw new NotFoundException(
          'Review not found. You have not reviewed this course yet.',
        );
      }
      throw error;
    }
  }

  /**
   * Create a reply to a review
   * Anyone can reply to any review
   * Optimized: Single query - foreign key constraint validates review existence
   */
  async createReviewReply(
    reviewId: string,
    user: currentClientUser,
    dto: CreateReviewReplyDto,
  ) {
    try {
      // Create reply directly - foreign key constraint ensures review exists
      const reply = await this.prisma.reviewReply.create({
        data: {
          reviewId: reviewId,
          userId: user.id,
          comment: dto.comment,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      const response: successResponse = {
        message: 'Reply created successfully',
        data: reply,
      };
      return response;
    } catch (error) {
      // Handle foreign key constraint violation (P2003)
      if (error.code === 'P2003') {
        throw new NotFoundException('Review not found');
      }
      throw error;
    }
  }

  /**
   * Get rating overview statistics for a course
   * Public endpoint - no authentication required
   * @param courseId - The course ID
   */
  async getRatingOverview(courseId: string) {
    // Get all reviews for the course
    const reviews = await this.prisma.review.findMany({
      where: {
        courseId,
        course: {
          deletedAt: null,
        },
      },
      select: {
        rating: true,
      },
    });

    const total = reviews.length;

    if (total === 0) {
      const response: successResponse = {
        message: 'Rating overview retrieved successfully',
        data: {
          average: 0,
          total: 0,
          breakdown: [
            { stars: 5, count: 0, percentage: 0 },
            { stars: 4, count: 0, percentage: 0 },
            { stars: 3, count: 0, percentage: 0 },
            { stars: 2, count: 0, percentage: 0 },
            { stars: 1, count: 0, percentage: 0 },
          ],
        },
      };
      return response;
    }

    // Calculate average
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / total;

    // Count reviews for each star rating
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      counts[review.rating]++;
    });

    // Create breakdown from 5 stars to 1 star
    const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: counts[stars],
      percentage: Math.round((counts[stars] / total) * 100),
    }));

    const response: successResponse = {
      message: 'Rating overview retrieved successfully',
      data: {
        average: Math.round(average * 10) / 10,
        total,
        breakdown,
      },
    };
    return response;
  }

  /**
   * Get reviews and replies for a course with filtering and pagination
   * Public endpoint - no authentication required
   * @param courseId - The course ID
   * @param rating - Optional: Filter by specific rating (1-5)
   * @param limit - Number of reviews to return (default: 4, pass 0 or large number for all)
   */
  async getCourseReviews(courseId: string, rating?: number, limit: number = 4) {
    // Build where clause with optional rating filter
    const whereClause: any = {
      courseId,
      course: {
        deletedAt: null,
      },
    };

    if (rating !== undefined && rating >= 1 && rating <= 5) {
      whereClause.rating = rating;
    }

    // Get total count for pagination info
    const totalCount = await this.prisma.review.count({
      where: whereClause,
    });

    // Get reviews with limit (0 means get all)
    const reviews = await this.prisma.review.findMany({
      where: whereClause,
      take: limit > 0 ? limit : undefined,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        course: {
          select: {
            teacherId: true,
          },
        },
        replies: {
          take: 4, // Limit to 4 most recent replies per review
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            replies: true, // Get total reply count for "show more" indicator
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data to add courseOwner flag and remove course object
    const transformedReviews = reviews.map((review) => {
      const { course, _count, ...reviewWithoutCourse } = review;
      return {
        ...reviewWithoutCourse,
        replies: review.replies.map((reply) => ({
          ...reply,
          courseOwner: reply.userId === course.teacherId,
        })),
        totalReplies: _count.replies,
        hasMoreReplies: _count.replies > 4,
      };
    });

    const response: successResponse = {
      message: 'Reviews retrieved successfully',
      data: {
        reviews: transformedReviews,
        total: totalCount,
        showing: reviews.length,
        hasMore: limit > 0 && totalCount > limit,
      },
    };
    return response;
  }
}
