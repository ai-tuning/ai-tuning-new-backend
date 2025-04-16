import { Module } from '@nestjs/common';
import { Kess3Service } from './kess3.service';
import { CredentialModule } from '../credential/credential.module';
import { PathService } from '../common';

@Module({
    imports: [CredentialModule],
    providers: [Kess3Service, PathService],
    exports: [Kess3Service],
})
export class Kess3Module {}
