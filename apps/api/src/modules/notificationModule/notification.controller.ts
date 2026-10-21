// notification.controller.ts
import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { NotificationService } from './notification.service';
import { ApiResponse } from 'src/utils/responseShaper';
import type { AuthenticatedRequest } from 'src/types/request';
import { PermissionsGuard } from 'src/guards/permission.guard';

@ApiTags('notifications')
@ApiCookieAuth('token')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({ summary: 'Get my notifications' })
  @Get()
  async getMyNotifications(@Req() req: AuthenticatedRequest) {
    const notifications = await this.notificationService.getMyNotifications(
      req.user.userId,
    );
    return ApiResponse.success(notifications, 'Notifications retrieved');
  }

  @ApiOperation({ summary: 'Get unread count' })
  @Get('unread-count')
  async getUnreadCount(@Req() req: AuthenticatedRequest) {
    const count = await this.notificationService.getUnreadCount(
      req.user.userId,
    );
    return ApiResponse.success({ count }, 'Unread count retrieved');
  }

  @ApiOperation({ summary: 'Mark notification as read' })
  @Patch(':id/read')
  async markAsRead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const notification = await this.notificationService.markAsRead(
      id,
      req.user.userId,
    );
    return ApiResponse.success(notification, 'Notification marked as read');
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Patch('read-all')
  async markAllAsRead(@Req() req: AuthenticatedRequest) {
    await this.notificationService.markAllAsRead(req.user.organizationId!);
    return ApiResponse.success(null, 'All notifications marked as read');
  }
}
