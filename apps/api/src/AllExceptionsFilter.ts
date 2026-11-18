import {
  type ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : exception,
    );

    host.switchToHttp().getResponse<Response>().status(500).json({
      success: false,
      data: null,
      message: 'Something went wrong. Please try again later.',
    });
  }
}
