// guards/permissions.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ALLOW_NO_ORG } from 'src/decorators/allowWithoutOrg.decorator';
import { AuthenticatedRequest } from 'src/types/request';

type userType = string;
type PermissionName = string;
type ResourcePermissions = Record<userType, PermissionName[]>;
type PermissionStructure = Record<string, ResourcePermissions>;

type HttpMethod =
  'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
type HttpMethodMap = Record<HttpMethod, PermissionName>;

export const ResourcePermissions = (permissions: Record<string, string[]>) =>
  Reflector.createDecorator<Record<string, string[]>>()(permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private permissionStructures: PermissionStructure = {
    // User module permissions
    users: {
      OWNER: ['CREATE', 'READ', 'UPDATE', 'MANAGE_ROLES'],
      MANAGER: ['CREATE', 'READ', 'UPDATE'],
      STAFF: ['READ', 'UPDATE'],
    },
    organizations: {
      OWNER: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE_ROLES'],
    },
    products: {
      OWNER: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      MANAGER: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      STAFF: ['READ'],
    },
    suppliers: {
      OWNER: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      MANAGER: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      STAFF: ['READ'],
    },
    notifications: {
      OWNER: ['READ', 'UPDATE'],
      MANAGER: ['READ', 'UPDATE'],
      STAFF: ['READ', 'UPDATE'],
    },
    'stock-movements': {
      OWNER: ['CREATE', 'READ'],
      MANAGER: ['CREATE', 'READ'],
      STAFF: ['READ'],
    },
    'stock-movement-requests': {
      OWNER: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      MANAGER: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      STAFF: ['CREATE', 'READ', 'DELETE'],
    },
    dashboard: {
      OWNER: ['READ'],
      MANAGER: ['READ'],
      STAFF: ['READ'],
    },
    // Default/fallback permissions
    default: {
      OWNER: ['ALL'],
      MANAGER: [],
      STAFF: [],
    },
  };

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const method = request.method as HttpMethod;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const allowNoOrg = this.reflector.getAllAndOverride<boolean>(ALLOW_NO_ORG, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!user.organizationId) {
      if (!allowNoOrg) {
        throw new ForbiddenException({
          code: 'NO_ORGANIZATION',
          message: 'You are not part of an organization.',
        });
      }
      return true;
    }

    const resource = this.getResource(context);

    const action = this.mapMethodToAction(method);

    const resourcePermissions =
      this.permissionStructures[resource] || this.permissionStructures.default;

    const userPermissions = resourcePermissions[user.userType] || [];

    const hasPermission =
      userPermissions.includes('ALL') || userPermissions.includes(action);

    if (!hasPermission) {
      throw new ForbiddenException(
        `User type ${user.userType} cannot ${action.toLowerCase()} ${resource}`,
      );
    }

    return true;
  }

  private getResource(context: ExecutionContext): string {
    const path = Reflect.getMetadata(PATH_METADATA, context.getClass()) as
      string | string[] | undefined;
    const first = Array.isArray(path) ? path[0] : path;
    return (first ?? '').replace(/^\/+|\/+$/g, '').toLowerCase() || 'default';
  }

  private mapMethodToAction(method: HttpMethod): PermissionName {
    const map: HttpMethodMap = {
      GET: 'READ',
      HEAD: 'READ',
      OPTIONS: 'READ',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return map[method] || 'READ';
  }
}
