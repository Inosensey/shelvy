// user controller
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';

// Guards
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permission.guard';

// utils
import { ApiResponse as ApiResponseShaper } from 'src/utils/responseShaper';

// Service
import { UserService } from './user.service';

// DTOs
import { UserResponseDTO } from './user.dto';

// types
import type { AuthenticatedRequest } from 'src/types/request';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
}
