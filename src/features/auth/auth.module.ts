import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { appConfig } from '../config';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';
import { CustomerModule } from '../customer/customer.module';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { AdminSchema } from '../admin/schema/admin.schema';
import { QueueManagerModule } from '../queue-manager/queue-manager.module';
import { VerificationMailModule } from '../verification-mail/verification-mail.module';
import { AdminModule } from '../admin/admin.module';
import { EmployeeModule } from '../employee/employee.module';
import { EmployeeRoleModule } from '../employee-role/employee-role.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: collectionsName.admin,
        schema: AdminSchema,
      },
    ]),
    JwtModule.registerAsync({
      useFactory() {
        const config = appConfig();
        return {
          secret: config.jwt_secret,
          signOptions: {
            expiresIn: config.access_token_expiration_minute,
          },
        };
      },
    }),
    UserModule,
    CustomerModule,
    EmployeeModule,
    EmployeeRoleModule,
    forwardRef(() => QueueManagerModule),
    VerificationMailModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
})
export class AuthModule {}
