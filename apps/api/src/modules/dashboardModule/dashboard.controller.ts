import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permission.guard';
import { DashboardService } from './dashboard.service';
import type { AuthenticatedRequest } from 'src/types/request';
import { ApiResponse as ApiResponseShaper } from 'src/utils/responseShaper';

@ApiTags('Dashboard')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('overview')
  async overview(@Req() req: AuthenticatedRequest) {
    const data = await this.service.getOverview(
      req.user.organizationId!,
      req.user.userId,
      req.user.userType,
    );
    return ApiResponseShaper.success(data, 'Overview retrieved successfully');
  }
}
