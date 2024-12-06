import { Module } from '@nestjs/common';
import { AutoFlasherService } from './auto-flasher.service';
import { HttpModule } from '@nestjs/axios';
import { CredentialModule } from '../credential/credential.module';

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
  providers: [AutoFlasherService],
})
export class AutoFlasherModule {}
