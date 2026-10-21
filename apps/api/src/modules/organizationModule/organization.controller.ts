// organization.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
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
  OrgInviteResponseDto,
  OrgMemberResponseDto,
  SendInviteEmailDTO,
  ValidateInviteResponseDTO,
} from './organization.dto';
import type { AuthenticatedRequest } from 'src/types/request';
import { plainToInstance } from 'class-transformer';
import { AllowWithoutOrganization } from 'src/decorators/allowWithoutOrg.decorator';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @ApiOperation({ summary: 'Create organization' })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({ status: 201, type: OrganizationResponseDTO })
  @AllowWithoutOrganization()
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

  @ApiOperation({ summary: 'Revoke an active organization invitation token' })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({
    description: 'Invitation token revoked successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access resource permissions error.',
  })
  @ApiResponse({
    status: 444, // Or HttpStatus.NOT_FOUND if Prisma throws an exception when the token isn't found
    description: 'Invitation token not found.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Delete('invites/:token/revoke')
  async revokeInvite(
    @Param('token') token: string,
    @Req() req: AuthenticatedRequest,
  ) {
    this.orgService.assertOwnerOrg(req);
    const updatedInvite = await this.orgService.revokeInvite(
      token,
      req.user.organizationId!,
    );

    const data = plainToInstance(OrgInviteResponseDto, updatedInvite, {
      excludeExtraneousValues: true,
    });

    return ApiResponseShaper.success(
      data,
      'Invitation token revoked successfully.',
    );
  }

  @ApiOperation({ summary: 'Send an organization invitation email' })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 201,
    description: 'Invite email sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input payload parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access resource permissions error.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Post('send-invite-email')
  async sendInviteEmail(
    @Body() data: SendInviteEmailDTO,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.orgService.sendInviteEmail(data, req.user.userId);
    return ApiResponseShaper.success(null, 'Invite email sent successfully');
  }

  @ApiOperation({ summary: 'Resend an organization invitation email' })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200, // 200 OK because we are modifying/updating an existing resource's communication state
    description: 'Invite email resent successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access resource permissions error.',
  })
  @ApiResponse({
    status: 404,
    description: 'Invitation record not found.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Put('invites/:token/resend')
  async resendInviteEmail(
    @Param('token') token: string,
    @Req() req: AuthenticatedRequest,
  ) {
    this.orgService.assertOwnerOrg(req);
    const updatedInviteRecord = await this.orgService.resendInvite(
      token,
      req.user.organizationId!,
    );
    return ApiResponseShaper.success(
      updatedInviteRecord,
      'Invite email resent successfully',
    );
  }

  @ApiOperation({ summary: 'Validate a pending invitation token' })
  @ApiResponse({
    status: 200,
    type: ValidateInviteResponseDTO, // Emits your new class type mapping here
    description: 'Invitation token verified successfully.',
  })
  @Get('invite/validate')
  async validateToken(@Query('token') token: string) {
    const metadata = await this.orgService.validateInviteToken(token);
    const data = {
      status: metadata.status,
      invite: metadata,
    };
    return ApiResponseShaper.success(
      data,
      'Invitation token verified successfully.',
    );
  }

  @ApiOperation({ summary: 'Get all members belonging to an organization' })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200,
    type: OrgMemberResponseDto,
    isArray: true,
    description: 'Members retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access resource permissions error.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Get('my/members')
  async getMembers(@Req() req: AuthenticatedRequest) {
    this.orgService.assertOwnerOrg(req);

    const members = await this.orgService.getOrgMembersByOrganizationId(
      req.user.organizationId!,
    );

    // Explicitly serializes to strip out undocumented fields securely
    const data = plainToInstance(OrgMemberResponseDto, members, {
      excludeExtraneousValues: true,
    });

    return ApiResponseShaper.success(data, 'Members retrieved successfully.');
  }

  @ApiOperation({ summary: 'Get all invitation records for an organization' })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200,
    type: OrgInviteResponseDto,
    isArray: true,
    description: 'Invite records retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access resource permissions error.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Get('my/invites')
  async getInvites(@Req() req: AuthenticatedRequest) {
    this.orgService.assertOwnerOrg(req);

    const invites = await this.orgService.getInviteRecordsByOrganizationId(
      req.user.organizationId!,
    );

    const data = plainToInstance(OrgInviteResponseDto, invites, {
      excludeExtraneousValues: true,
    });

    return ApiResponseShaper.success(
      data,
      'Invite records retrieved successfully.',
    );
  }
  @ApiOperation({
    summary: 'Get all pending invitation records for an organization',
  })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200,
    type: OrgInviteResponseDto,
    isArray: true,
    description: 'Invite records retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access resource permissions error.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Get('my/invites/pending')
  async getPendingInvites(@Req() req: AuthenticatedRequest) {
    this.orgService.assertOwnerOrg(req);
    const invites =
      await this.orgService.getPendingInviteRecordsByOrganizationId(
        req.user.organizationId!,
      );

    const data = plainToInstance(OrgInviteResponseDto, invites, {
      excludeExtraneousValues: true,
    });

    return ApiResponseShaper.success(
      data,
      'Pending invite records retrieved successfully.',
    );
  }

  @ApiOperation({
    summary: 'Get all revoked invitation records for an organization',
  })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200,
    type: OrgInviteResponseDto,
    isArray: true,
    description: 'Invite records retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access resource permissions error.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Get('my/invites/revoked')
  async getRevokedInvites(@Req() req: AuthenticatedRequest) {
    this.orgService.assertOwnerOrg(req);
    const invites =
      await this.orgService.getRevokedInviteRecordsByOrganizationId(
        req.user.organizationId!,
      );

    const data = plainToInstance(OrgInviteResponseDto, invites, {
      excludeExtraneousValues: true,
    });

    return ApiResponseShaper.success(
      data,
      'Revoked invite records retrieved successfully.',
    );
  }

  @ApiOperation({ summary: 'Remove or evict a member from the organization' })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200,
    description: 'Member removed from organization successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Member removed from organization successfully.',
        },
        data: { type: 'string', example: 'usr_memberId123' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access resource permissions error.',
  })
  @ApiResponse({
    status: 444,
    description: 'Member record not found within this organization context.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Delete('members/:memberId')
  async removeMember(
    @Param('memberId') memberId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    this.orgService.assertOwnerOrg(req);
    const removedId = await this.orgService.removeOrgMember(
      memberId,
      req.user.organizationId!,
      req.user.userId,
    );

    return ApiResponseShaper.success(
      removedId,
      'Member removed from organization successfully.',
    );
  }

  @AllowWithoutOrganization()
  @UseGuards(AuthGuard, PermissionsGuard)
  @Post('invites/:token/accept')
  async acceptInvite(
    @Param('token') token: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.orgService.acceptInvite(token, req.user.userId);
    return ApiResponseShaper.success(null, 'You have joined the organization.');
  }
}
