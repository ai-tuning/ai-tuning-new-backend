import { Module } from '@nestjs/common';
import { AutoTunerService } from './auto-tuner.service';
import { HttpModule } from '@nestjs/axios';
import { CredentialModule } from '../credential/credential.module';
import { PathService } from '../common';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://api.autotuner-tool.com/v2/api/v1/master',
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    CredentialModule,
  ],
  providers: [AutoTunerService, PathService],
  exports: [AutoTunerService],
})
export class AutoTunerModule {}
