import { Controller, Post, Body, HttpCode, HttpStatus, Req, Res, Param, Redirect } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common';
import { RegistrationDto } from './dto/registration.dto';

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
      //redirect to verification page
      return response.redirect(301, `${origin}/auth/verify`);
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
}
