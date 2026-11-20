import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permission.guard';
import { ProductService } from './product.service';
import {
  CreateProductDTO,
  ProductDetailResponseDTO,
  ProductQueryDTO,
  ProductResponseDTO,
  UpdateProductDTO,
} from './product.dto';
import type { AuthenticatedRequest } from 'src/types/request';
import { ApiResponse as ApiResponseShaper } from 'src/utils/responseShaper';
import { plainToInstance } from 'class-transformer';
import { Readable } from 'node:stream';
import { manilaDate } from 'src/utils/csv.util';
import { Role } from 'generated/prisma/enums';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductImportService } from './product.import.service';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Products')
@ApiBearerAuth()
@ApiCookieAuth('token')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('products')
export class ProductController {
  constructor(
    private readonly service: ProductService,
    private readonly importService: ProductImportService,
  ) {}

  private readonly logger = new Logger(ProductController.name);

  @ApiOperation({
    summary: 'List and filter catalog products with pagination status bounds',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Products retrieve successfully' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/ProductResponseDTO' },
            },
            total: {
              type: 'number',
              description:
                'Total count of products matching the query filters.',
              example: 125,
            },
            page: {
              type: 'number',
              description: 'Current page number.',
              example: 1,
            },
            pageSize: {
              type: 'number',
              description: 'Number of items returned per page.',
              example: 20,
            },
          },
          required: ['items', 'total', 'page', 'pageSize'],
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
  async getProducts(
    @Req() req: AuthenticatedRequest,
    @Query() query: ProductQueryDTO,
  ) {
    const response = await this.service.getProducts(
      req.user.organizationId!,
      query,
    );
    return ApiResponseShaper.success(
      response,
      'Products retrieve successfully',
    );
  }

  @ApiOperation({
    summary: 'Get a lightweight list of products for dropdown/select options',
  })
  @ApiResponse({
    status: 200,
    description: 'Product options retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Product options retrieved successfully',
        },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductOptionsResponseDTO' },
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
    const response = await this.service.getOptions(req.user.organizationId!);
    return ApiResponseShaper.success(
      response,
      'Product options retrieved successfully',
    );
  }

  @ApiOperation({ summary: 'Create a new catalog product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully.',
    type: ProductResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid product details input validation schema payloads.',
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
  async createProduct(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProductDTO,
  ) {
    const response = await this.service.createProduct(
      req.user.organizationId!,
      req.user.userId,
      dto,
    );
    return ApiResponseShaper.success(response, 'Product successfully created');
  }

  @ApiOperation({ summary: 'Update an existing product specification record' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully.',
    type: ProductResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid partial property update values.',
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
    description:
      'Target product ID not found within this organization context.',
  })
  @Patch(':id')
  async updateProduct(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProductDTO,
  ) {
    const response = await this.service.updateProduct(
      id,
      req.user.organizationId!,
      dto,
    );
    return ApiResponseShaper.success(response, 'Product updated successfully');
  }

  @ApiOperation({
    summary: 'Soft-archive a product to hide it from standard listings',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the product to archive.',
    type: 'string',
    example: 'cm3x8y9z00003prd901mno234',
  })
  @ApiResponse({
    status: 200,
    description: 'Product archived successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Product archived successfully.' },
        data: { $ref: '#/components/schemas/ProductResponseDTO' },
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
    status: 404,
    description:
      'Target product ID not found within this organization context.',
  })
  @Patch(':id/archive')
  async archiveProduct(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const response = await this.service.archiveProduct(
      id,
      req.user.organizationId!,
    );
    return ApiResponseShaper.success(
      response,
      'Product archived successfully.',
    );
  }

  @ApiOperation({
    summary: 'Unarchive and restore a product back to regular listings',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the product to restore.',
    type: 'string',
    example: 'cm3x8y9z00003prd901mno234',
  })
  @ApiResponse({
    status: 200,
    description: 'Product restored successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Product restored successfully.' },
        data: { $ref: '#/components/schemas/ProductResponseDTO' },
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
    status: 404,
    description:
      'Target product ID not found within this organization context.',
  })
  @Patch(':id/unarchive')
  async unarchiveProduct(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const response = await this.service.unarchiveProduct(
      id,
      req.user.organizationId!,
    );
    return ApiResponseShaper.success(
      response,
      'Product restored successfully.',
    );
  }

  @ApiOperation({
    summary:
      'Get a comprehensive product details record alongside analytic insights',
  })
  @ApiResponse({
    status: 200,
    description:
      'Product detail with analytical stats and trends retrieved successfully.',
    type: ProductDetailResponseDTO,
  })
  @Get(':id')
  async getProductDetails(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const data = await this.service.getProductDetails(
      id,
      req.user.organizationId!,
    );

    // Explicitly run your serialization over the compound payload safely
    const serializedData = plainToInstance(ProductDetailResponseDTO, data, {
      excludeExtraneousValues: true,
    });

    return ApiResponseShaper.success(
      serializedData,
      'Product retrieved successfully',
    );
  }

  @ApiOperation({
    summary:
      'Generate a unique, automated SKU suggestion based on a product name string',
  })
  @ApiQuery({
    name: 'name',
  })
  @ApiResponse({
    status: 200,
    description:
      'A customized product SKU suggestion string was generated successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'SKU suggested' },
        data: {
          type: 'string',
          example: 'WIRELESS-KEYBO-BLU-XL',
          description: 'The recommended uppercase alphanumeric SKU code string',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or empty product name query input parameter.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access resource permissions error.',
  })
  @Get('sku/suggestion')
  async suggestSku(
    @Req() req: AuthenticatedRequest,
    @Query('name') name: string,
  ) {
    const data = await this.service.suggestSku(req.user.organizationId!, name);
    return ApiResponseShaper.success(data, 'SKU suggested');
  }

  @ApiOperation({
    summary: 'Export catalog products as a CSV file',
    description:
      'Allows owners and managers to export product data based on query filters. Returns a downloadable CSV stream.',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file download.',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access. Only owners and managers can export data.',
  })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Get('misc/export')
  async export(@Req() req: AuthenticatedRequest, @Query() q: ProductQueryDTO) {
    if (req.user.userType === Role.STAFF) {
      throw new ForbiddenException('Only owners and managers can export data.');
    }
    const orgId = req.user.organizationId!;
    await this.service.assertExportable(orgId, q);
    this.logger.log(
      `Products export by user ${req.user.userId} (org ${orgId})`,
    );

    return new StreamableFile(Readable.from(this.service.exportCsv(orgId, q)), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="products-${manilaDate()}.csv"`,
    });
  }

  @ApiOperation({
    summary: 'Preview a product catalog import file',
    description:
      'Validates a CSV/Excel file upload and returns a parsed preview of the data along with any validation errors before finalizing the import.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'The product CSV or Excel file to upload (Max: 1MB)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Import file parsed and validated successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Import preview ready' },
        data: {
          type: 'object',
          properties: {
            summary: {
              type: 'object',
              properties: {
                create: { type: 'number', example: 30 },
                update: { type: 'number', example: 10 },
                unchanged: { type: 'number', example: 2 },
                errors: { type: 'number', example: 3 },
              },
              required: ['create', 'update', 'unchanged', 'errors'],
            },
            rows: {
              type: 'array',
              description: 'Parsed row-by-row results produced by toResults().',
              items: {
                type: 'object',
                additionalProperties: true,
                example: {
                  row: 2,
                  action: 'create',
                  sku: 'SKU-001',
                  name: 'Sample Product',
                  errors: [],
                  initialStock: 15,
                },
              },
            },
            ignoredColumns: {
              type: 'array',
              description:
                'Column headers from the uploaded file that were ignored during parsing.',
              items: { type: 'string', example: 'extra_notes' },
            },
          },
          required: ['summary', 'rows', 'ignoredColumns'],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. File is missing, improperly formatted, or exceeds the size limit.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 429,
    description:
      'Too Many Requests. Rate limit of 5 requests per minute exceeded.',
  })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('misc/import/preview')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 1_000_000, files: 1 } }),
  )
  async importPreview(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.importService.preview(
      req.user.organizationId!,
      file,
    );
    return ApiResponseShaper.success(data, 'Import preview ready');
  }

  @ApiOperation({
    summary: 'Commit a product catalog import file',
    description:
      'Validates and commits product creations and updates from the uploaded CSV/Excel file within a database transaction, recording initial stock movements where applicable.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'The product CSV or Excel file to process and save (Max: 1MB)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Products imported and committed to the database successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Import complete' },
        data: {
          type: 'object',
          properties: {
            created: {
              type: 'number',
              description: 'Number of new products created.',
              example: 30,
            },
            updated: {
              type: 'number',
              description: 'Number of existing products updated.',
              example: 10,
            },
            unchanged: {
              type: 'number',
              description:
                'Number of rows skipped because no changes were detected.',
              example: 2,
            },
          },
          required: ['created', 'updated', 'unchanged'],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request. File is missing, improperly formatted, exceeds size limits, or contains row validation errors.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden. Organization has reached its subscription plan product limit.',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict. A SKU in the file was claimed by another concurrent operation during import.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests. Rate limit exceeded.',
  })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('misc/import/commit')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 1_000_000, files: 1 } }),
  )
  async importCommit(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.importService.commit(
      req.user.organizationId!,
      req.user.userId,
      file,
    );
    return ApiResponseShaper.success(data, 'Import complete');
  }
}
