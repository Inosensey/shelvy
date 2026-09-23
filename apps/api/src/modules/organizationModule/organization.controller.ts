// organization.controller.ts
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permission.guard';
import { ApiResponse as ApiResponseShaper } from 'src/utils/responseShaper';
import { OrganizationService } from './organization.service';
import {
  CreateOrganizationDTO,
  OrganizationResponseDTO,
} from './organization.dto';
import type { AuthenticatedRequest } from 'src/types/request';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @ApiOperation({ summary: 'Create organization' })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({ status: 201, type: OrganizationResponseDTO })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Post()
  async createOrganization(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateOrganizationDTO,
  ) {
    const org = await this.orgService.createOrganization(dto, req.user.userId);
    return ApiResponseShaper.success(org, 'Organization created successfully');
  }

  @ApiOperation({ summary: 'Get my organization' })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({ status: 200, type: OrganizationResponseDTO })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Get('me')
  async getMyOrganization(@Req() req: AuthenticatedRequest) {
    const org = await this.orgService.getMyOrganization(req.user.userId);
    return ApiResponseShaper.success(
      org,
      'Organization retrieved successfully',
    );
  }
}
