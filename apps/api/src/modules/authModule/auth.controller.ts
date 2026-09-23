// auth controller
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
import { RegisterDTO, LoginDTO } from './auth.dto';
import { UserResponseDTO } from 'src/modules/usersModule/user.dto';
import { SubscriptionPlan } from 'generated/prisma/enums';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
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
  @Post('register')
  async createUser(
    @Body()
    user: RegisterDTO,
  ) {
    if (user.plan && user.plan !== SubscriptionPlan.FREE) {
      user.plan = SubscriptionPlan.FREE;
    }
    const result = await this.authService.createUser(user);
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

  @ApiOperation({
    summary: 'Sign out user',
    description:
      'Invalidates the user session and clears the authentication cookie.',
  })
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
      sameSite: 'none',
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
}
