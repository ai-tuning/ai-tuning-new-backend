import { Module } from '@nestjs/common';
import { AutoFlasherService } from './auto-flasher.service';
import { HttpModule } from '@nestjs/axios';
import { CredentialModule } from '../credential/credential.module';
import { PathService } from '../common';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://autoflasher-portal.de/api',
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    CredentialModule,
  ],
  providers: [AutoFlasherService, PathService],
  exports: [AutoFlasherService],
})
export class AutoFlasherModule {}
