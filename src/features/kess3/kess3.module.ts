import { Module } from '@nestjs/common';
import { Kess3Service } from './kess3.service';
import { HttpModule } from '@nestjs/axios';
import { CredentialModule } from '../credential/credential.module';
import { PathService } from '../common';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: async () => {
        return {
          baseURL: 'https://encodingapi.alientech.to',
          headers: { 'Content-Type': 'application/json' },
        };
      },
    }),
    CredentialModule,
  ],
  providers: [Kess3Service, PathService],
  exports: [Kess3Service],
})
export class Kess3Module {}
