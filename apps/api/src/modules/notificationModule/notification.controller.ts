// notification.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { NotificationService } from './notification.service';
import { ApiResponse as ApiResponseShaper } from 'src/utils/responseShaper';
import type { AuthenticatedRequest } from 'src/types/request';
import { PermissionsGuard } from 'src/guards/permission.guard';
import { UpdateNotificationSettingDTO } from './notification.dto';

@ApiTags('notifications')
@ApiCookieAuth('token')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({
    summary: 'Get my notifications',
    description:
      'Retrieves a list of all notifications for the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Notifications retrieved' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            // Adjust these properties to match your actual Notification model or swap with $ref
            properties: {
              id: { type: 'string', example: 'notif_123abc' },
              title: { type: 'string', example: 'Low Stock Alert' },
              message: {
                type: 'string',
                example: 'Product SKU-001 has dropped below threshold.',
              },
              isRead: { type: 'boolean', example: false },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2026-11-13T09:50:00.000Z',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @Get()
  async getMyNotifications(@Req() req: AuthenticatedRequest) {
    const notifications = await this.notificationService.getMyNotifications(
      req.user.userId,
    );
    return ApiResponseShaper.success(notifications, 'Notifications retrieved');
  }

  @ApiOperation({
    summary: 'Get unread count',
    description:
      'Retrieves the total number of unread notifications for the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Unread count retrieved' },
        data: {
          type: 'object',
          properties: {
            count: {
              type: 'number',
              description: 'Total count of unread notifications.',
              example: 5,
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @Get('unread-count')
  async getUnreadCount(@Req() req: AuthenticatedRequest) {
    const count = await this.notificationService.getUnreadCount(
      req.user.userId,
    );
    return ApiResponseShaper.success({ count }, 'Unread count retrieved');
  }

  @ApiOperation({
    summary: 'Mark notification as read',
    description:
      'Marks a specific notification as read for the currently authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the notification to mark as read.',
    type: 'string',
    example: 'notif_123abc',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Notification marked as read' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'notif_123abc' },
            isRead: { type: 'boolean', example: true },
          },
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
    description: 'Notification not found or does not belong to the user.',
  })
  @Patch(':id/read')
  async markAsRead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const notification = await this.notificationService.markAsRead(
      id,
      req.user.userId,
    );
    return ApiResponseShaper.success(
      notification,
      'Notification marked as read',
    );
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Patch('read-all')
  async markAllAsRead(@Req() req: AuthenticatedRequest) {
    await this.notificationService.markAllAsRead(req.user.userId);
    return ApiResponseShaper.success(null, 'All notifications marked as read');
  }

  @ApiOperation({
    summary: 'Get my notification settings',
    description:
      'Retrieves the notification preferences (such as email, push, and alert triggers) for the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification settings retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Notification settings retrieved' },
        data: {
          type: 'object',
          // Adjust these properties to match your actual notification settings model
          properties: {
            emailNotifications: { type: 'boolean', example: true },
            lowStockAlerts: { type: 'boolean', example: true },
            orderUpdates: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @Get('settings')
  async getSettings(@Req() req: AuthenticatedRequest) {
    const data = await this.notificationService.getSettings(req.user.userId);
    return ApiResponseShaper.success(data, 'Notification settings retrieved');
  }

  @ApiOperation({
    summary: 'Update my notification settings',
    description:
      'Updates one or more notification preferences for the currently authenticated user.',
  })
  @ApiBody({ type: UpdateNotificationSettingDTO })
  @ApiResponse({
    status: 200,
    description: 'Notification settings saved successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Notification settings saved' },
        data: {
          type: 'object',
          // Adjust these properties to match your actual notification settings model
          properties: {
            emailNotifications: { type: 'boolean', example: true },
            lowStockAlerts: { type: 'boolean', example: false },
            orderUpdates: { type: 'boolean', example: false },
          },
        },
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
  @Patch('settings')
  async updateSettings(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateNotificationSettingDTO,
  ) {
    const data = await this.notificationService.updateSettings(
      req.user.userId,
      dto,
    );
    return ApiResponseShaper.success(data, 'Notification settings saved');
  }
}
