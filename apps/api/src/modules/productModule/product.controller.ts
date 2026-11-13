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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
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
import { UploadedFile, UseInterceptors } from '@nestjs/common';
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
          type: 'array',
          items: { $ref: '#/components/schemas/ProductResponseDTO' },
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
    status: 201,
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
    status: 444,
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
  @ApiResponse({
    status: 201,
    description: 'Product archived successfully.',
    type: ProductResponseDTO,
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
    return ApiResponseShaper.success(response, 'Product archive successfully');
  }

  @ApiOperation({
    summary: 'Unarchive and restore a product back to regular listings',
  })
  @ApiResponse({
    status: 201,
    description: 'Product unarchive successfully.',
    type: ProductResponseDTO,
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
      'Product unarchive successfully',
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
    description:
      'Products export started successfully. Returns a CSV file stream embedded in the response wrapper.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Products export started' },
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
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Get('misc/export')
  async export(@Req() req: AuthenticatedRequest, @Query() q: ProductQueryDTO) {
    if (req.user.userType === Role.STAFF) {
      throw new ForbiddenException('Only owners and managers can export data.');
    }
    console.log('export query:', q);
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
          // Adjust properties below to match your actual this.importService.preview return structure
          properties: {
            validRowsCount: { type: 'number', example: 42 },
            invalidRowsCount: { type: 'number', example: 3 },
            errors: {
              type: 'array',
              items: {
                type: 'string',
                example: 'Row 4: Price must be a positive number',
              },
            },
          },
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
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('misc/import/preview')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 1_000_000, files: 1 } }),
  )
  async importPreview(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('importPreview file:', file);
    const data = await this.importService.preview(
      req.user.organizationId!,
      file,
    );
    return ApiResponseShaper.success(data, 'Import preview ready');
  }

  @ApiOperation({
    summary: 'Commit a product catalog import file',
    description:
      'Uploads, processes, and permanently saves product data into the database from the provided file layout.',
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
            inserted: { type: 'number', example: 40 },
            updated: { type: 'number', example: 2 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request. Parsing errors found or payload validation failed during execution.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
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
