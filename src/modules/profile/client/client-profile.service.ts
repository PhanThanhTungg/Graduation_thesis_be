import {
  Injectable,
  ConflictException,
  ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  UpdateClientProfileDto
} from './dto/client-profile.dto';
import { UserRole } from '../../../common/enums/common.enum';

@Injectable()
export class ClientProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(
    user: any,
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
      data: updateDto,
    });

    return updatedUser;
  }
}
