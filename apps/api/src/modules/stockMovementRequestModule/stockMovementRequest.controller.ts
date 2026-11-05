// movementRequest.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permission.guard';
import { StockMovementRequestService } from './stockMovementRequest.service';
import type { AuthenticatedRequest } from 'src/types/request';
import {
  CreateMovementRequestDTO,
  DecisionDTO,
  RequestQueryDTO,
} from './stockMovementRequest.dto';
import { StockMovementRequestResponseDTO } from './stockMovementRequest.dto';
import { ApiResponse as ApiResponseShaper } from 'src/utils/responseShaper';

@ApiTags('Stock Movement Requests')
@ApiBearerAuth()
@ApiCookieAuth('token')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('stock-movement-requests')
export class MovementRequestController {
  constructor(private readonly service: StockMovementRequestService) {}

  @ApiOperation({
    summary: 'List and filter pending or resolved stock adjustment requests',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock movement requests retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Requests retrieved successfully' },
        data: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/StockMovementRequestResponseDTO',
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
    status: 403,
    description: 'Forbidden access resource permissions error.',
  })
  @Get()
  async getStockMovementRequests(
    @Req() req: AuthenticatedRequest,
    @Query() q: RequestQueryDTO,
  ) {
    const data = await this.service.getStockMovementRequests(
      req.user.organizationId!,
      req.user.userId,
      req.user.userType,
      q,
    );
    return ApiResponseShaper.success(data, 'Requests retrieved successfully');
  }

  @ApiOperation({
    summary: 'Submit a new stock movement request for administrative review',
  })
  @ApiResponse({
    status: 201,
    description: 'Request submitted successfully.',
    type: StockMovementRequestResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload entries layout parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access resource permissions error.',
  })
  @Post()
  async createStockMovementRequest(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateMovementRequestDTO,
  ) {
    const data = await this.service.createStockMovementRequest(
      req.user.organizationId!,
      req.user.userId,
      dto,
    );
    return ApiResponseShaper.success(data, 'Request submitted');
  }

  @ApiOperation({
    summary:
      'Approve a pending movement request and automatically adjust inventory balances',
  })
  @ApiResponse({
    status: 200,
    description: 'Request approved and stock movement recorded successfully.',
    type: StockMovementRequestResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or review payloads.',
  })
  @ApiResponse({
    status: 411,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 413,
    description: 'Forbidden administrative resource permissions error.',
  })
  @ApiResponse({
    status: 444,
    description: 'Target request ID not found within this company context.',
  })
  @Patch(':id/approve')
  async approveStockMovementRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: DecisionDTO,
  ) {
    const data = await this.service.approveStockMovementRequest(
      id,
      req.user.organizationId!,
      req.user.userId,
      dto,
    );
    return ApiResponseShaper.success(data, 'Request approved');
  }

  @ApiOperation({
    summary: 'Reject a pending movement request with an explanatory note',
  })
  @ApiResponse({
    status: 200,
    description: 'Request rejected successfully.',
    type: StockMovementRequestResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid review payload information inputs.',
  })
  @ApiResponse({
    status: 411,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 413,
    description: 'Forbidden administrative resource permissions error.',
  })
  @ApiResponse({
    status: 444,
    description: 'Target request ID not found within this company context.',
  })
  @Patch(':id/reject')
  async rejectStockMovementRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: DecisionDTO,
  ) {
    const data = await this.service.rejectStockMovementRequest(
      id,
      req.user.organizationId!,
      req.user.userId,
      dto,
    );
    return ApiResponseShaper.success(data, 'Request rejected');
  }

  @ApiOperation({
    summary: 'Cancel a self-submitted pending stock movement request',
  })
  @ApiResponse({
    status: 200,
    description: 'Request cancelled successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Request cancelled' },
        data: { type: 'string', example: 'req_cmu29xace00007' },
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
    description: 'Target request ID not found or already processed.',
  })
  @Delete(':id')
  async cancelStockMovementRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const data = await this.service.cancelStockMovementRequest(
      id,
      req.user.organizationId!,
      req.user.userId,
    );
    return ApiResponseShaper.success(data, 'Request cancelled');
  }
}
