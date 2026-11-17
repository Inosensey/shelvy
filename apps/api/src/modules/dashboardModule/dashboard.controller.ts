import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permission.guard';
import { DashboardService } from './dashboard.service';
import type { AuthenticatedRequest } from 'src/types/request';
import { ApiResponse as ApiResponseShaper } from 'src/utils/responseShaper';

@ApiTags('Dashboard')
@ApiBearerAuth()
@ApiCookieAuth('token')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @ApiOperation({
    summary: 'Get the dashboard overview for the signed-in user',
  })
  @ApiResponse({ status: 200, description: 'Overview retrieved successfully.' })
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
