// user controller
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiBody,
  getSchemaPath,
} from '@nestjs/swagger';

// Guards
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permission.guard';

// utils
import { ApiResponse as ApiResponseShaper } from 'src/utils/responseShaper';

// Service
import { UserService } from './user.service';

// DTOs
import {
  CreateUserInfoDTO,
  SaveMemberOnboardingBodyDTO,
  SaveOrgOnboardingDTO,
  UserInfoResponseDTO,
  UserResponseDTO,
} from './user.dto';
import { CreateOrganizationDTO } from '../organizationModule/organization.dto';

// types
import type { AuthenticatedRequest } from 'src/types/request';
import { AllowWithoutOrganization } from 'src/decorators/allowWithoutOrg.decorator';
import { ChangePasswordDTO, UpdateProfileDTO } from './settings.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Get user information by ID',
    description:
      "Retrieves a user's personal information by their user ID. Requires authentication.",
  })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
    type: UserInfoResponseDTO,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - No valid token provided',
  })
  @ApiResponse({
    status: 404,
    description: 'User information not found',
  })
  @AllowWithoutOrganization()
  @UseGuards(AuthGuard, PermissionsGuard)
  @Get('me/info')
  async getMeInfo(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;

    const user = await this.userService.getUserInfoById(userId);

    return ApiResponseShaper.success(
      user,
      'User information retrieved successfully',
    );
  }

  @ApiOperation({
    summary: 'Get user by ID',
    description:
      "Retrieves a user's public information by their ID. Requires authentication.",
  })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDTO,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - No valid token provided',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Get('/:id')
  async getUserById(
    @Param('id') userId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    this.userService.assertUser(userId, req);

    const user = await this.userService.getUserById(userId);
    return ApiResponseShaper.success(user, 'User retrieved successfully');
  }

  @ApiOperation({
    summary: 'Get current user',
    description:
      "Retrieves the authenticated user's profile using the JWT stored in the authentication cookie.",
  })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200,
    description: 'Authenticated user retrieved successfully',
    type: UserResponseDTO,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid authentication token',
  })
  @AllowWithoutOrganization()
  @UseGuards(AuthGuard, PermissionsGuard)
  @Get('me/user')
  async getMe(@Req() req: AuthenticatedRequest) {
    const user = await this.userService.getUserById(req.user.userId);

    return ApiResponseShaper.success(
      user,
      'Authenticated user retrieved successfully',
    );
  }

  @ApiOperation({
    summary: 'Create user information',
    description:
      'Creates personal information for a user. Requires authentication.',
  })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 201,
    description: 'User information created successfully',
    type: UserInfoResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid user information provided',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - No valid token provided',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User information already exists',
  })
  @AllowWithoutOrganization()
  @UseGuards(AuthGuard, PermissionsGuard)
  @Post('me/info')
  async createUserInfo(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateUserInfoDTO,
  ) {
    const userInfo = await this.userService.createUserInfo(
      dto,
      req.user.userId,
    );

    return ApiResponseShaper.success(
      userInfo,
      'User information created successfully',
    );
  }

  @ApiOperation({
    summary: 'Save onboarding information',
    description:
      "Saves the authenticated user's profile information and creates their organization.",
  })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiBody({
    description:
      'User profile and organization information required to complete onboarding.',
    schema: {
      type: 'object',
      properties: {
        userInfo: { $ref: getSchemaPath(CreateUserInfoDTO) },
        organization: { $ref: getSchemaPath(CreateOrganizationDTO) },
      },
      required: ['userInfo', 'organization'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Onboarding completed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid onboarding data' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid authentication token',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict - User has already completed onboarding or organization already exists',
  })
  @AllowWithoutOrganization()
  @UseGuards(AuthGuard, PermissionsGuard)
  @Post('me/org/onboarding')
  async saveOrgOnboardingInfo(
    @Req() req: AuthenticatedRequest,
    @Body()
    data: SaveOrgOnboardingDTO,
  ) {
    const result = await this.userService.saveOrgOnboardingInfo(
      data,
      req.user.userId,
    );
    return ApiResponseShaper.success(
      result,
      'Onboarding completed successfully',
    );
  }

  @ApiOperation({
    summary: 'Save member onboarding information',
    description:
      'Saves the profile information for an invited member to complete their platform entry setup.',
  })
  @ApiResponse({
    status: 201,
    description: 'Member onboarding completed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user profile onboarding data',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Member profile has already been initialized',
  })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('me/member/onboarding')
  async saveMemberOnboardingInfo(
    @Body()
    data: SaveMemberOnboardingBodyDTO,
  ) {
    const result = await this.userService.saveMemberOnboardingInfo(data);
    return ApiResponseShaper.success(
      result,
      'Member onboarding completed successfully',
    );
  }

  @ApiOperation({
    summary: 'Get security info for the current user',
    description:
      'Retrieves security-related details for the logged-in user, including their authentication provider, password status, and active session count.',
  })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200,
    description: 'Security information retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Security info retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            authProvider: {
              type: 'string',
              enum: ['LOCAL', 'GOOGLE', 'GITHUB'],
              example: 'LOCAL',
            },
            hasPassword: {
              type: 'boolean',
              description:
                'Indicates whether the user has a local password set.',
              example: true,
            },
            activeSessions: {
              type: 'number',
              description:
                'Total count of currently valid, unexpired login sessions.',
              example: 2,
            },
          },
          required: ['authProvider', 'hasPassword', 'activeSessions'],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. User account could not be found.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Get('me/security')
  async getSecurity(@Req() req: AuthenticatedRequest) {
    const data = await this.userService.getSecurityInfo(req.user.userId);
    return ApiResponseShaper.success(
      data,
      'Security info retrieved successfully',
    );
  }

  @ApiOperation({
    summary: 'Update personal profile details',
    description:
      'Updates descriptive profile metadata for the authenticated user, such as name or contact details.',
  })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiBody({ type: UpdateProfileDTO })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Profile updated successfully' },
        data: { $ref: '#/components/schemas/UserResponseDTO' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Validation errors encountered in payload DTO.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Patch('me/info')
  async updateMyInfo(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDTO,
  ) {
    const data = await this.userService.updateUserInfo(req.user.userId, dto);
    return ApiResponseShaper.success(data, 'Profile updated successfully');
  }

  @ApiOperation({
    summary: 'Change account password',
    description:
      'Modifies the user password after verifying their old credentials. Invalidates other active login sessions.',
  })
  @ApiBearerAuth()
  @ApiCookieAuth('token')
  @ApiBody({ type: ChangePasswordDTO })
  @ApiResponse({
    status: 200,
    description: 'Password changed. Other devices were signed out.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Password changed. Other devices were signed out.',
        },
        data: { type: 'object', nullable: true, example: null },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request. Current password verification failed or criteria unmet.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Patch('me/password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async updatePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDTO,
  ) {
    const token = req.cookies?.token as string;
    await this.userService.updatePassword(req.user.userId, token, dto);
    return ApiResponseShaper.success(
      null,
      'Password changed. Other devices were signed out.',
    );
  }
}
