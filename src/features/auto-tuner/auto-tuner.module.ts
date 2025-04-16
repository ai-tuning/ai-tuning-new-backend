import { Module } from '@nestjs/common';
import { AutoTunerService } from './auto-tuner.service';
import { CredentialModule } from '../credential/credential.module';
import { PathService } from '../common';

@Module({
    imports: [CredentialModule],
    providers: [AutoTunerService, PathService],
    exports: [AutoTunerService],
})
export class AutoTunerModule {}
