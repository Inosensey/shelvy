import { Prisma } from 'generated/prisma/client';

import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';

import { Response } from 'express';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientInitializationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    // Handle Database Connection / Initialization Errors
    if (exception instanceof Prisma.PrismaClientInitializationError) {
      this.logger.error(
        `Database initialization failure: ${exception.message}`,
      );

      return response.status(500).json({
        success: false,
        data: null,
        message:
          'The database service is currently unavailable. Please try again later.',
      });
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          const target = Array.isArray(exception.meta?.target)
            ? exception.meta.target.join(', ')
            : 'Field';

          const formattedTarget =
            target.charAt(0).toUpperCase() + target.slice(1);

          return response.status(409).json({
            success: false,
            data: null,
            message: `${formattedTarget} already exists.`,
          });
        }

        case 'P2025':
          return response.status(404).json({
            success: false,
            data: null,
            message: 'The requested record could not be found.',
          });

        default:
          this.logger.error(
            `Prisma database error [${exception.code}]: ${exception.message}`,
          );

          return response.status(500).json({
            success: false,
            data: null,
            message:
              'An unexpected database error occurred. Please try again later.',
          });
      }
    }

    // Fallback
    this.logger.error('Unhandled database exception', exception);

    return response.status(500).json({
      success: false,
      data: null,
      message: 'An unexpected database error occurred. Please try again later.',
    });
  }
}
