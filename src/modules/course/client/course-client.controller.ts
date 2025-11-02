import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CourseService } from './course-client.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import { UserRole } from 'src/common/enums/common.enum';
import { ClientRoleGuard, ClientRoles } from 'src/common/guards/client-role.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';

@Controller('course')
@ApiTags('Client / Course')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}
  
  // route for teacher
  @Get()
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  async getCourses(@CurrentUser() user: currentClientUser) {
    return user;
  }

  @Post()
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  async createCourse(@CurrentUser() user: currentClientUser) {
    return user;
  }

}
