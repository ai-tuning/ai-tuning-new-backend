import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { appConfig } from '../config';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [JwtModule.registerAsync({
    useFactory() {
      const config = appConfig()
      return {
        secret: config.jwt_secret,
        signOptions: {
          expiresIn: config.access_token_expiration_minute
        }
      }
    },
  }), UserModule],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService]
})
export class AuthModule { }
