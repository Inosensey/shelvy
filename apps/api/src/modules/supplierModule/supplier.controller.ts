import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import {
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierQueryDTO,
  SupplierResponseDTO,
} from './supplier.dto';
import type { AuthenticatedRequest } from 'src/types/request';
import { ApiResponse as ApiResponseShaper } from 'src/utils/responseShaper';
import { PermissionsGuard } from 'src/guards/permission.guard';
import { AuthGuard } from 'src/guards/auth.guard';

@ApiTags('Suppliers')
@ApiBearerAuth()
@ApiCookieAuth('token')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly service: SupplierService) {}

  @ApiOperation({ summary: 'List and filter suppliers with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Suppliers retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Suppliers retrieved successfully',
        },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/SupplierResponseDTO' },
        },
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
  @Get()
  async getSuppliers(
    @Req() req: AuthenticatedRequest,
    @Query() query: SupplierQueryDTO,
  ) {
    const data = await this.service.getSuppliers(
      req.user.organizationId!,
      query,
    );
    return ApiResponseShaper.success(data, 'Suppliers retrieved successfully');
  }

  @ApiOperation({
    summary: 'Get a lightweight list of suppliers for dropdown/select options',
  })
  @ApiResponse({
    status: 200,
    description: 'Supplier options retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Supplier options retrieved' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/SupplierOptionsResponseDTO' },
        },
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
  @Get('options')
  async getOptions(@Req() req: AuthenticatedRequest) {
    const data = await this.service.getOptions(req.user.organizationId!);
    return ApiResponseShaper.success(data, 'Supplier options retrieved');
  }

  @ApiOperation({ summary: 'Create a new supplier record' })
  @ApiResponse({
    status: 201,
    description: 'Supplier created successfully.',
    type: SupplierResponseDTO,
  })
  @ApiResponse({ status: 400, description: 'Invalid payload input values.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access resource permissions error.',
  })
  @Post()
  async createSupplier(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSupplierDTO,
  ) {
    const data = await this.service.createSupplier(
      req.user.organizationId!,
      dto,
    );
    return ApiResponseShaper.success(data, 'Supplier created successfully');
  }

  @ApiOperation({ summary: 'Update an existing supplier record' })
  @ApiResponse({
    status: 200,
    description: 'Supplier updated successfully.',
    type: SupplierResponseDTO,
  })
  @ApiResponse({ status: 400, description: 'Invalid payload input values.' })
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
    description: 'Supplier record not found within this organization context.',
  })
  @Patch(':id')
  async updateSupplier(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDTO,
  ) {
    const data = await this.service.updateSupplier(
      id,
      req.user.organizationId!,
      dto,
    );
    return ApiResponseShaper.success(data, 'Supplier updated successfully');
  }

  @ApiOperation({ summary: 'Delete a supplier record' })
  @ApiResponse({
    status: 200,
    description: 'Supplier deleted successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Supplier deleted successfully' },
        data: { type: 'string', example: 'sup_cmu29xace' },
      },
    },
  })
  @ApiResponse({
    status: 411,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 413,
    description: 'Forbidden access resource permissions error.',
  })
  @ApiResponse({
    status: 444,
    description: 'Supplier record not found within this organization context.',
  })
  @Delete(':id')
  async deleteSupplier(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const deletedId = await this.service.deleteSupplier(
      id,
      req.user.organizationId!,
    );
    return ApiResponseShaper.success(
      deletedId,
      'Supplier deleted successfully',
    );
  }
}
