import {
  Injectable,
  ConflictException,
  ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  UpdateClientProfileDto,
  UpdateTeacherProfileDto
} from './dto/client-profile.dto';
import { UserRole } from '../../../common/enums/common.enum';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';

@Injectable()
export class ClientProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(
    user: currentClientUser,
    updateDto: UpdateClientProfileDto,
  ): Promise<any> {
    if (updateDto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateDto.email,
          id: { not: user.id },
        },
      });
      if (existingUser) {
        throw new ConflictException('Email has been used by another account');
      }
    }

    if (updateDto.role === UserRole.teacher && !user.emailVerified) {
      throw new ForbiddenException('Email has not been verified');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...updateDto,
        ...(updateDto.email && (updateDto.email !== user.email) && { emailVerified: false }),
      },
      select:{
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerified: true,
        avatarUrl: true,
        status: true,
        country: true,
      }
    });

    return updatedUser;
  }

  async updateTeacherProfile(
    user: currentClientUser,
    updateDto: UpdateTeacherProfileDto,
  ): Promise<any> {
    return this.prisma.teacherSetting.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...updateDto,
      },
      update: updateDto,
    });
  }
}
