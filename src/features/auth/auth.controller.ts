import { Controller, Post, Body, HttpCode, HttpStatus, Req, Res, Param, Redirect, Get } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthResponse, AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common';
import { RegistrationDto } from './dto/registration.dto';
import { VerificationEmailDto } from './dto/verificationEmail.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  @Public()
  async login(@Body() loginDto: LoginDto, @Req() request: Request, @Res() response: Response) {
    const data = await this.authService.logIn(loginDto);

    if ('isVerified' in data && !data.isVerified) {
      const origin = request.headers.origin;
      return response.status(200).json({
        message: 'Please verify your email. Verification code sent to your email',
        data: { url: `${origin}/auth/code-verification?email=${data.generateVerificationCode.email}` },
      });
    }
    const { accessToken, refreshToken, user } = data as {
      accessToken: string;
      refreshToken: string;
      user: any;
    };

    let domain = '';
    let sameSite: 'lax' | 'strict' | 'none' | boolean = 'lax';
    const origin = request.headers.host;
    console.log(origin);
    if (origin.includes('.ecufile.eu')) {
      domain = 'ai-tuningfiles.com';
      sameSite = 'none';
    } else if (origin.includes('.tuningfile-server.com')) {
      domain = 'ai-tuningfiles.com';
      sameSite = 'none';
    } else if (origin.includes('dyno-files.org')) {
      domain = 'ai-tuningfiles.com';
      sameSite = 'none';
    } else if (origin.includes('.ai-tuningfiles.com')) {
      domain = 'ai-tuningfiles.com';
    } else {
      domain = 'localhost';
    }

    response.cookie('ai-tuning-refresh-token', refreshToken, {
      domain,
      sameSite,
      path: '/',
      secure: true,
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    response.status(HttpStatus.OK).json({ data: { user, accessToken }, message: 'Login successful' });
  }

  @HttpCode(HttpStatus.OK)
  @Post('/verify-email')
  @Public()
  async verifyRegistrationCode(
    @Body() verificationEmailDto: VerificationEmailDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const authData = await this.authService.verifyRegistrationCode(
      verificationEmailDto.email,
      verificationEmailDto.code,
    );
    const { accessToken, refreshToken, user } = authData as {
      accessToken: string;
      refreshToken: string;
      user: any;
    };

    let domain = '';
    let sameSite: 'lax' | 'strict' | 'none' | boolean = 'lax';
    const origin = request.headers.host;
    console.log(origin);
    if (origin.includes('.ecufile.eu')) {
      domain = 'ai-tuningfiles.com';
      sameSite = 'none';
    } else if (origin.includes('.tuningfile-server.com')) {
      domain = 'ai-tuningfiles.com';
      sameSite = 'none';
    } else if (origin.includes('dyno-files.org')) {
      domain = 'ai-tuningfiles.com';
      sameSite = 'none';
    } else if (origin.includes('.ai-tuningfiles.com')) {
      domain = 'ai-tuningfiles.com';
    } else {
      domain = 'localhost';
    }

    response.cookie('ai-tuning-refresh-token', refreshToken, {
      domain,
      sameSite,
      path: '/',
      secure: true,
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    response.status(HttpStatus.OK).json({ data: { user, accessToken }, message: 'Verification successful' });
  }

  @HttpCode(HttpStatus.OK)
  @Post('/registration')
  @Public()
  async registration(@Body() registrationDto: RegistrationDto) {
    const data = await this.authService.registration(registrationDto);
    return { data, message: 'Registration Success' };
  }

  @HttpCode(HttpStatus.OK)
  @Post('/registration/:username')
  @Public()
  async registrationWithUsername(@Param('username') username: string, @Body() registrationDto: RegistrationDto) {
    const data = await this.authService.registration(registrationDto, username);
    return { data, message: 'Registration Success' };
  }

  @HttpCode(HttpStatus.OK)
  @Post('/resend-code')
  @Public()
  async resendCode(@Body() resendCodeDto: { email: string }) {
    await this.authService.resendCode(resendCodeDto.email);
    return { message: 'Verification code sent to your email' };
  }

  //refresh token
  @HttpCode(HttpStatus.OK)
  @Get('/refresh')
  @Public()
  async refreshToken(@Req() request: Request) {
    const cookie = request.cookies['ai-tuning-refresh-token'];
    const data = await this.authService.refreshToken(cookie);
    return { data, message: 'Refresh token successful' };
  }

  //refresh token
  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('/logout')
  @Public()
  async logout(@Res() response: Response) {
    response.clearCookie('ai-tuning-refresh-token');
    response.status(HttpStatus.OK).json({ message: 'Logout successful' });
  }
}
