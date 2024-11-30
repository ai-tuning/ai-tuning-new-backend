import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  @Public()
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.logIn(loginDto);
    let domain = '';
    let sameSite: 'lax' | 'strict' | 'none' | boolean = 'lax';
    const hostname = request.headers.origin;
    console.log(hostname);
    if (hostname.includes('.ecufile.eu')) {
      domain = 'ai-tuningfiles.com';
      sameSite = 'none';
    } else if (hostname.includes('.tuningfile-server.com')) {
      domain = 'ai-tuningfiles.com';
      sameSite = 'none';
    } else if (hostname.includes('dyno-files.org')) {
      domain = 'ai-tuningfiles.com';
      sameSite = 'none';
    } else if (hostname.includes('.ai-tuningfiles.com')) {
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
    return { data: { user, accessToken }, message: 'Login successful' };
  }
}
