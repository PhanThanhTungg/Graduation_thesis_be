import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { successResponse } from 'src/common/interfaces/response.interface';
import { PurchaseDiskSpaceDto } from './dto/purchase-disk-space.dto';
import { GetDiskPurchaseHistoryDto } from './dto/get-disk-purchase-history.dto';
import { GetTeacherFilesDto } from './dto/get-teacher-files.dto';
import {
  TransactionType,
  TransactionStatus,
  PlatformTransactionType,
} from '@prisma/client';

@Injectable()
export class DiskClientService {
  constructor(private readonly prisma: PrismaService) {}

  async getDiskSpace(currentUser: currentClientUser) {
    const diskSpace = await this.prisma.diskSpaceTeacher.findUnique({
      where: { userId: currentUser.id },
      select: {
        id: true,
        userId: true,
        value: true,
        from: true,
        to: true,
      },
    });

    const [fileSizeResult, videoSizeResult] = await Promise.all([
      this.prisma.file.aggregate({
        where: {
          lesson: {
            chapter: {
              course: {
                teacherId: currentUser.id,
                deletedAt: null,
              },
            },
          },
        },
        _sum: {
          fileSize: true,
        },
      }),
      this.prisma.videoLesson.aggregate({
        where: {
          lesson: {
            chapter: {
              course: {
                teacherId: currentUser.id,
                deletedAt: null,
              },
            },
          },
        },
        _sum: {
          size: true,
        },
      }),
    ]);

    const fileSize = fileSizeResult._sum.fileSize || 0;
    const videoSize = videoSizeResult._sum.size || 0;
    const usedSpace = fileSize + videoSize;

    const response: successResponse = {
      message: 'Get disk space successfully',
      data: diskSpace
        ? {
            ...diskSpace,
            usedSpace,
          }
        : null,
    };

    return response;
  }

  async getDiskPurchaseHistory(
    dto: GetDiskPurchaseHistoryDto,
    currentUser: currentClientUser,
  ) {
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    const [platformTransactions, total] = await Promise.all([
      this.prisma.platformTransaction.findMany({
        where: {
          userId: currentUser.id,
          type: PlatformTransactionType.disk_space_income,
        },
        select: {
          id: true,
          amount: true,
          description: true,
          metadata: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.platformTransaction.count({
        where: {
          userId: currentUser.id,
          type: PlatformTransactionType.disk_space_income,
        },
      }),
    ]);

    const purchases = platformTransactions.map((transaction) => {
      const metadata = transaction.metadata as any;
      return {
        id: transaction.id,
        value: metadata?.value || 0,
        months: metadata?.months || 0,
        pricePer100Mb: metadata?.pricePer100Mb || 0,
        totalPrice: transaction.amount,
        createdAt: transaction.createdAt,
        dateFrom: metadata?.dateFrom || transaction.createdAt.toISOString(),
        dateTo: metadata?.dateTo || transaction.createdAt.toISOString(),
      };
    });

    const totalPages = Math.ceil(total / limit);

    const response: successResponse = {
      message: 'Get disk purchase history successfully',
      data: {
        purchases,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };

    return response;
  }

  async purchaseDiskSpace(
    dto: PurchaseDiskSpaceDto,
    currentUser: currentClientUser,
  ) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: currentUser.id },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const adminSetting = await this.prisma.adminSetting.findFirst();
    if (!adminSetting) {
      throw new NotFoundException('Admin settings not found');
    }

    const pricePer100Mb = adminSetting.feeUploadPer100Mb;
    const totalPrice = (dto.value / 100) * pricePer100Mb * dto.months;

    if (wallet.balance < totalPrice) {
      throw new BadRequestException('Insufficient balance');
    }

    let platformWallet = await this.prisma.platformWallet.findFirst();
    if (!platformWallet) {
      platformWallet = await this.prisma.platformWallet.create({
        data: { revenue: 0 },
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore - totalPrice;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          totalSpent: wallet.totalSpent + totalPrice,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.disk,
          amount: -totalPrice,
          balanceBefore,
          balanceAfter,
          status: TransactionStatus.completed,
          description: `Purchase ${dto.value}MB disk space for ${dto.months} month(s)`,
          metadata: {
            value: dto.value,
            months: dto.months,
            pricePer100Mb,
            totalPrice,
          },
        },
      });

      const existingDiskSpace = await tx.diskSpaceTeacher.findUnique({
        where: { userId: currentUser.id },
      });

      const now = new Date();
      let dateFrom: Date;
      let dateTo: Date;

      if (existingDiskSpace) {
        const currentToDate = existingDiskSpace.to;
        dateFrom =
          currentToDate > now ? new Date(currentToDate) : new Date(now);
        dateTo = new Date(dateFrom);
        dateTo.setMonth(dateTo.getMonth() + dto.months);

        await tx.diskSpaceTeacher.update({
          where: { userId: currentUser.id },
          data: {
            value: existingDiskSpace.value + dto.value,
            to: dateTo,
          },
        });
      } else {
        dateFrom = new Date(now);
        dateTo = new Date(now);
        dateTo.setMonth(dateTo.getMonth() + dto.months);

        await tx.diskSpaceTeacher.create({
          data: {
            userId: currentUser.id,
            value: dto.value,
            to: dateTo,
          },
        });
      }

      const platformBalanceBefore = platformWallet.revenue;
      const platformBalanceAfter = platformBalanceBefore + totalPrice;

      await tx.platformWallet.update({
        where: { id: platformWallet.id },
        data: {
          revenue: platformBalanceAfter,
        },
      });

      await tx.platformTransaction.create({
        data: {
          walletId: platformWallet.id,
          type: PlatformTransactionType.disk_space_income,
          amount: totalPrice,
          balanceBefore: platformBalanceBefore,
          balanceAfter: platformBalanceAfter,
          description: `Disk space purchase: ${dto.value}MB for ${dto.months} month(s) by user ${currentUser.id}`,
          userId: currentUser.id,
          metadata: {
            value: dto.value,
            months: dto.months,
            pricePer100Mb,
            totalPrice,
            dateFrom: dateFrom.toISOString(),
            dateTo: dateTo.toISOString(),
          },
        },
      });

      return {
        totalPrice,
        balanceAfter,
      };
    });

    const response: successResponse = {
      message: 'Disk space purchased successfully',
      data: result,
    };

    return response;
  }

  async getTeacherFiles(
    dto: GetTeacherFilesDto,
    currentUser: currentClientUser,
  ) {
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    // Fetch both files and videos
    const [files, videos] = await Promise.all([
      this.prisma.file.findMany({
        where: {
          lesson: {
            chapter: {
              course: {
                teacherId: currentUser.id,
                deletedAt: null,
              },
            },
          },
        },
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          fileUrl: true,
          createdAt: true,
          lesson: {
            select: {
              title: true,
              chapter: {
                select: {
                  title: true,
                  course: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.videoLesson.findMany({
        where: {
          lesson: {
            chapter: {
              course: {
                teacherId: currentUser.id,
                deletedAt: null,
              },
            },
          },
        },
        select: {
          id: true,
          videoId: true,
          embedUrl: true,
          size: true,
          duration: true,
          createdAt: true,
          lesson: {
            select: {
              title: true,
              chapter: {
                select: {
                  title: true,
                  course: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    // Combine files and videos into a single array
    const combinedItems = [
      ...files.map((file) => ({
        id: file.id,
        name: file.fileName,
        size: file.fileSize,
        url: file.fileUrl,
        type: 'file' as const,
        createdAt: file.createdAt,
        lessonTitle: file.lesson.title,
        chapterTitle: file.lesson.chapter.title,
        courseTitle: file.lesson.chapter.course.title,
      })),
      ...videos.map((video) => ({
        id: video.id,
        name: `Video: ${video.lesson.title}`,
        size: video.size || 0,
        url: video.embedUrl,
        type: 'video' as const,
        duration: video.duration,
        createdAt: video.createdAt,
        lessonTitle: video.lesson.title,
        chapterTitle: video.lesson.chapter.title,
        courseTitle: video.lesson.chapter.course.title,
      })),
    ];

    // Sort by creation date (newest first)
    combinedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const total = combinedItems.length;
    const paginatedItems = combinedItems.slice(skip, skip + limit);

    const formattedItems = paginatedItems.map((item) => ({
      id: item.id,
      name: item.name,
      size: item.size,
      url: item.url,
      type: item.type,
      duration: 'duration' in item ? item.duration : undefined,
      createdAt: item.createdAt,
      lessonTitle: item.lessonTitle,
      chapterTitle: item.chapterTitle,
      courseTitle: item.courseTitle,
    }));

    const totalPages = Math.ceil(total / limit);

    const response: successResponse = {
      message: 'Get teacher files successfully',
      data: {
        files: formattedItems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };

    return response;
  }
}
