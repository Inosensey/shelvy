// stockMovement.controller.ts
import {
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  StreamableFile,
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
import { StockMovementService } from './stockMovement.service';
import {
  MovementQueryDTO,
  RecordMovementDTO,
  StockMovementResponseDTO,
} from './stockMovement.dto';
import type { AuthenticatedRequest } from 'src/types/request';
import { ApiResponse as ApiResponseShaper } from 'src/utils/responseShaper';
import { Role } from 'generated/prisma/enums';
import { manilaDate } from 'src/utils/csv.util';
import { Readable } from 'node:stream';

@ApiTags('Stock Movements')
@ApiBearerAuth()
@ApiCookieAuth('token')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('stock-movements')
export class StockMovementController {
  constructor(private readonly service: StockMovementService) {}

  private readonly logger = new Logger(StockMovementController.name);
  @ApiOperation({
    summary:
      'List and audit organization stock tracking ledgers with pagination filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock movement ledgers retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Stock Movements retrieve successfully',
        },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/StockMovementResponseDTO' },
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
  async getStockMovements(
    @Req() req: AuthenticatedRequest,
    @Query() query: MovementQueryDTO,
  ) {
    const response = await this.service.getStockMovements(
      req.user.organizationId!,
      query,
    );
    return ApiResponseShaper.success(
      response,
      'Stock Movements retrieve successfully',
    );
  }

  @ApiOperation({
    summary: 'Record a new absolute inventory adjustment or transaction log',
  })
  @ApiResponse({
    status: 201,
    description:
      'Stock movement recorded and inventory balances cached successfully.',
    type: StockMovementResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid adjustment entries payload validation configurations.',
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
  async recordStockMovements(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordMovementDTO,
  ) {
    const response = await this.service.recordStockMovement(
      req.user.organizationId!,
      req.user.userId,
      dto,
    );
    return ApiResponseShaper.success(
      response.movement,
      'Stock Movement successfully created',
    );
  }

  @ApiOperation({
    summary:
      'Calculate which page number a specific stock movement row belongs to',
  })
  @ApiResponse({
    status: 200,
    description:
      'The target page number was calculated and resolved successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Page resolved' },
        data: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 3,
              description:
                'The absolute 1-indexed pagination page where this record sits',
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden access resource permissions error.',
  })
  @ApiResponse({
    status: 444,
    description:
      'Target stock movement row ID not found within this company context.',
  })
  @Get(':id/page')
  async getPageOf(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    const data = await this.service.getPageOf(
      req.user.organizationId!,
      id,
      pageSize,
    );
    return ApiResponseShaper.success(data, 'Page resolved');
  }

  @ApiOperation({
    summary: 'Export catalog Stock Movements as a CSV file',
    description:
      'Allows owners and managers to export stock movement data based on query filters. Returns a downloadable CSV stream.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Stock movements export started successfully. Returns a CSV file stream embedded in the response wrapper.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Stock movements export started' },
        data: {
          type: 'string',
          format: 'binary',
          description: 'The generated CSV file stream (text/csv).',
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
    description: 'Forbidden access. Only owners and managers can export data.',
  })
  @Get('misc/export')
  async export(@Req() req: AuthenticatedRequest, @Query() q: MovementQueryDTO) {
    if (req.user.userType === Role.STAFF) {
      throw new ForbiddenException('Only owners and managers can export data.');
    }
    const orgId = req.user.organizationId!;
    await this.service.assertExportable(orgId, q);
    this.logger.log(
      `Stock movements export by user ${req.user.userId} (org ${orgId})`,
    );

    return new StreamableFile(Readable.from(this.service.exportCsv(orgId, q)), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="stock-movements-${manilaDate()}.csv"`,
    });
  }
}
