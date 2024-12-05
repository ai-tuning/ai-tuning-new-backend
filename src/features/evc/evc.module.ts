import { Module } from '@nestjs/common';
import { EvcService } from './evc.service';
import { EvcController } from './evc.controller';
import { HttpModule } from '@nestjs/axios';
import { appConfig } from '../config';
import { CredentialModule } from '../credential/credential.module';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: async () => {
        const config = appConfig();
        return {
          baseURL: config.evc_base_url,
        };
      },
    }),
    CredentialModule,
  ],
  controllers: [EvcController],
  providers: [EvcService],
  exports: [EvcService],
})
export class EvcModule {}
