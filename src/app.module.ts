import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { appConfig } from './features/config/app.config';
import { UserModule } from './features/user/user.module';
import * as Joi from 'joi';
import { CommonModule } from './features/common/config.module';
import { AuthModule } from './features/auth/auth.module';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { SecurityModule } from './features/security/security.module';
import { MailModule } from './features/mail/mail.module';
import { ProfileModule } from './features/profile/profile.module';
import { CustomerModule } from './features/customer/customer.module';
import { AdminModule } from './features/admin/admin.module';
import { EmployeeModule } from './features/employee/employee.module';
import { SettingModule } from './features/setting/setting.module';
import { CredentialModule } from './features/credential/credential.module';
import { RoleModule } from './features/role/role.module';
import { CarModule } from './features/car/car.module';
import { ChatModule } from './features/chat/chat.module';
import { CarControllerModule } from './features/car-controller/car-controller.module';
import { DecodeEncodeModule } from './features/decode-encode/decode-encode.module';
import { DtcModule } from './features/dtc/dtc.module';
import { InvoiceModule } from './features/invoice/invoice.module';
import { FileServiceModule } from './features/file-service/file-service.module';
import { ScriptModule } from './features/script/script.module';
import { SolutionModule } from './features/solution/solution.module';
import { SupportTicketModule } from './features/support-ticket/support-ticket.module';
import { EvcModule } from './features/evc/evc.module';
import { SuperAdminModule } from './features/super-admin/super-admin.module';
import { QueueManagerModule } from './features/queue-manager/queue-manager.module';
import { BullModule } from '@nestjs/bull';
import { Kess3Module } from './features/kess3/kess3.module';
import { AutoTunerModule } from './features/auto-tuner/auto-tuner.module';
import { AutoFlasherModule } from './features/auto-flasher/auto-flasher.module';
import { StorageServiceModule } from './features/storage-service/storage-service.module';
import { VerificationMailModule } from './features/verification-mail/verification-mail.module';
import { PricingModule } from './features/pricing/pricing.module';
import { PurchaseModule } from './features/purchase/purchase.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { EmployeeRoleModule } from './features/employee-role/employee-role.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: Joi.object({
        MONGODB_URL: Joi.required(),
        JWT_SECRET: Joi.string().required(),
        COOKIE_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRATION_MINUTES: Joi.string().required(),
        JWT_REFRESH_EXPIRATION_DAYS: Joi.number().required(),
        MASTER_PASSWORD: Joi.string().required(),
        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().required(),
        SMTP_INVOICE_EMAIL: Joi.string().required(),
        SMTP_INVOICE_PASSWORD: Joi.string().required(),
        SMTP_INVOICE_SENDER_EMAIL: Joi.string().required(),
        SMTP_SUPPORT_EMAIL: Joi.string().required(),
        SMTP_SUPPORT_PASSWORD: Joi.string().required(),
        SMTP_INFO_EMAIL: Joi.string().required(),
        SMTP_INFO_PASSWORD: Joi.string().required(),
        SMTP_AUTH_EMAIL: Joi.string().required(),
        SMTP_AUTH_PASSWORD: Joi.string().required(),
        PAYPAL_CLIENT_ID: Joi.string().required(),
        PAYPAL_CLIENT_SECRET: Joi.string().required(),
        ALIEN_TECH_CLIENT_ID: Joi.string().required(),
        ALIEN_TECH_SECRET_KEY: Joi.string().required(),
        EVC_API_ID: Joi.string().required(),
        EVC_USERNAME: Joi.string().required(),
        EVC_PASSWORD: Joi.string().required(),
        CATAPUSH_APP_ID: Joi.string().required(),
        CATAPUSH_MESSENGER_ID: Joi.string().required(),
        CATAPUSH_APP_KEY: Joi.string().required(),
        PERMANENT_TOKEN: Joi.string().required(),
        CATAPUSH_CLIENT_ID: Joi.string().required(),
        CATAPUSH_CLIENT_SECRET: Joi.string().required(),
        AUTO_TUNER_API_KEY: Joi.string().required(),
        AUTO_TUNER_ID: Joi.string().required(),
        AUTO_FLASHER_API_KEY: Joi.string().required(),
        SFTP_HOST: Joi.string().required(),
        SFTP_PORT: Joi.number().required(),
        SFTP_USER: Joi.string().required(),
        SFTP_PASSWORD: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
        EVC_BASE_URL: Joi.string().required(),
        ENCRYPTION_KEY: Joi.string().required(),
        MEGA_EMAIL: Joi.string().required(),
        MEGA_PASSWORD: Joi.string().required(),
      }),
    }),

    MongooseModule.forRootAsync({
      useFactory: () => {
        const config = appConfig();
        return {
          uri: config.mongodb_url,
        };
      },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      fallbacks: {
        'en-*': 'en',
        'bn-*': 'bn',
      },
      resolvers: [{ use: QueryResolver, options: ['lang'] }, AcceptLanguageResolver],
    }),
    BullModule.forRootAsync({
      useFactory: () => {
        const config = appConfig();
        return {
          redis: {
            host: config.redis_host,
            port: Number(config.redis_port),
          },
        };
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), 'public', 'car-logos'), // Serve only 'car-logos' folder
      serveRoot: '/car-logos', // Keep the same route
    }),
    SecurityModule,
    CommonModule,
    UserModule,
    AuthModule,
    MailModule,
    ProfileModule,
    CustomerModule,
    AdminModule,
    EmployeeModule,
    SettingModule,
    CredentialModule,
    RoleModule,
    CarModule,
    ChatModule,
    CarControllerModule,
    DecodeEncodeModule,
    DtcModule,
    InvoiceModule,
    FileServiceModule,
    ScriptModule,
    SolutionModule,
    SupportTicketModule,
    EvcModule,
    SuperAdminModule,
    QueueManagerModule,
    Kess3Module,
    AutoTunerModule,
    AutoFlasherModule,
    StorageServiceModule,
    VerificationMailModule,
    PricingModule,
    PurchaseModule,
    EmployeeRoleModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
