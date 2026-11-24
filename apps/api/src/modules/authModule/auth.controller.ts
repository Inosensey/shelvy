// auth controller
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiBody,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';

// Guards
import { AuthGuard } from 'src/guards/auth.guard';
import { AlreadyAuthGuard } from 'src/guards/alreadyAuth.guard';

// Interceptors
import { CookieCheckInterceptor } from 'src/interceptor/cookieCheck.interceptor';

// utils
import { ApiResponse as ApiResponseShaper } from 'src/utils/responseShaper';

// Service
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

// DTOs
import { RegisterDTO, LoginDTO, DemoSignInDTO } from './auth.dto';
import { UserResponseDTO } from 'src/modules/usersModule/user.dto';
import { Role, SubscriptionPlan } from 'generated/prisma/enums';
import type { AuthenticatedRequest } from 'src/types/request';
import { DemoService } from '../demoModule/demo.service';
import { DEMO } from '../demoModule/demo.data';
import { assertNotDemo } from '../demoModule/demo.util';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly demoService: DemoService,
  ) {}

  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account with the provided credentials.',
  })
  @ApiBody({ type: RegisterDTO })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDTO,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input or email already exists',
  })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async createUser(
    @Body()
    user: RegisterDTO,
  ) {
    if (user.plan && user.plan !== SubscriptionPlan.FREE) {
      user.plan = SubscriptionPlan.FREE;
    }
    const result = await this.authService.createUser(user, Role.OWNER);
    return ApiResponseShaper.success(result, 'User created successfully');
  }

  @ApiOperation({
    summary: 'Sign in user',
    description: 'Authenticates a user and sets a secure httpOnly cookie.',
  })
  @ApiBody({ type: LoginDTO })
  @ApiResponse({
    status: 200,
    description: 'Sign in successful',
    type: UserResponseDTO,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UseGuards(AlreadyAuthGuard)
  @Post('sign-in')
  @HttpCode(200)
  @UseInterceptors(CookieCheckInterceptor)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async signInUser(
    @Body()
    credentials: LoginDTO,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.signIn(credentials);

    response.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return ApiResponseShaper.success(
      {
        userId: result.userId,
        email: result.email,
        userType: result.userType,
      },
      'Signed in successfully. Connecting to Dashboard...',
    );
  }

  @UseGuards(AlreadyAuthGuard)
  @Post('demo-sign-in')
  @HttpCode(200)
  @UseInterceptors(CookieCheckInterceptor)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async demoSignIn(
    @Body() { role }: DemoSignInDTO,
    @Res({ passthrough: true }) response: Response,
  ) {
    const password = process.env.DEMO_PASSWORD;
    if (!password) {
      throw new ServiceUnavailableException('Demo is not available.');
    }

    await this.demoService.resetIfStale();

    const credentials: LoginDTO = {
      email: DEMO.users[role].email,
      password,
    };

    const result = await this.authService.signIn(credentials);

    response.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return ApiResponseShaper.success(
      {
        userId: result.userId,
        email: result.email,
        userType: result.userType,
      },
      'Signed in to the demo. Connecting to Dashboard...',
    );
  }

  @ApiOperation({
    summary: 'Sign out user',
    description:
      'Invalidates the user session and clears the authentication cookie.',
  })
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200,
    description: 'Signed out successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Signed out successfully' },
        data: { type: 'null', example: null },
      },
    },
  })
  @Post('sign-out')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @UseInterceptors(CookieCheckInterceptor)
  async signOutUser(
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    const token = request.cookies?.token as string;
    await this.authService.signOut(token);
    response.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
    return ApiResponseShaper.success(null, 'Signed out successfully');
  }

  @ApiOperation({
    summary: 'Validate current session',
    description: 'Checks if the current session token is still valid.',
  })
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200,
    description: 'Session validation result',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Session is valid' },
        data: { type: 'boolean', example: true },
      },
    },
  })
  @Get('session/validate')
  async validateSession(@Req() request: Request) {
    const token = request.cookies?.token as string;
    const isValid = await this.sessionService.validateSession(token);
    if (isValid) {
      return ApiResponseShaper.success(true, 'Session is valid');
    }
    return ApiResponseShaper.success(false, 'Session is invalid');
  }

  @ApiOperation({
    summary: 'Issue a short-lived WebSocket authentication ticket',
    description:
      'Generates a single-purpose JWT token valid for 60 seconds so the client can authenticate a WebSocket connection.',
  })
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200,
    description: 'Socket ticket issued successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Socket ticket issued' },
        data: {
          type: 'object',
          properties: {
            ticket: {
              type: 'string',
              description: 'Short-lived JWT token (expires in 60 seconds).',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
          required: ['ticket'],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @UseGuards(AuthGuard)
  @Get('socket-ticket')
  getSocketTicket(@Req() req: AuthenticatedRequest) {
    const ticket = this.authService.createSocketTicket(req);
    return ApiResponseShaper.success({ ticket }, 'Socket ticket issued');
  }

  @ApiOperation({
    summary: 'Revoke all other active sessions',
    description:
      'Terminates all active login sessions for the current user across other devices, except for the current session token.',
  })
  @ApiCookieAuth('token')
  @ApiResponse({
    status: 200,
    description:
      'Other sessions successfully revoked or no other active sessions found.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Signed out of 2 other device(s).',
        },
        data: {
          type: 'object',
          properties: {
            count: {
              type: 'number',
              description: 'The number of active sessions that were closed.',
              example: 2,
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
  @Post('sessions/revoke-others')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async revokeAllUserSessions(@Req() req: AuthenticatedRequest) {
    assertNotDemo(req.user.userId);
    const count = await this.sessionService.revokeAllUserSessions(
      req.user.userId,
      req.cookies?.token as string,
    );
    return ApiResponseShaper.success(
      { count },
      count
        ? `Signed out of ${count} other device(s).`
        : 'No other devices were signed in.',
    );
  }
}
