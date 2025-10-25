import { Controller, Get, UseGuards } from '@nestjs/common';
import { CourseService } from './course.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import { UserRole } from 'src/common/enums/common.enum';
import { ClientRoleGuard, ClientRoles } from 'src/common/guards/client-role.guard';

@Controller('course')
@ApiTags('Course')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}


}
