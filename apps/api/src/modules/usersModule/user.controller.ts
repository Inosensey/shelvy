// user controller
import {
  Body,
  Controller,
  Get,
  Param,
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
  SaveOnboardingDTO,
  UserInfoResponseDTO,
  UserResponseDTO,
} from './user.dto';
import { CreateOrganizationDTO } from '../organizationModule/organization.dto';

// types
import type { AuthenticatedRequest } from 'src/types/request';

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
  async getUserById(@Param('id') userId: string) {
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
  @UseGuards(AuthGuard, PermissionsGuard)
  @Get('me')
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
  @UseGuards(AuthGuard, PermissionsGuard)
  @Post('me/onboarding')
  async saveOnboardingInfo(
    @Req() req: AuthenticatedRequest,
    @Body()
    data: SaveOnboardingDTO,
  ) {
    const result = await this.userService.saveOnboardingInfo(
      data,
      req.user.userId,
    );
    return ApiResponseShaper.success(
      result,
      'Onboarding completed successfully',
    );
  }
}
