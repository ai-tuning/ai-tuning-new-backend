import { Module } from '@nestjs/common';
import { AutoFlasherService } from './auto-flasher.service';
import { CredentialModule } from '../credential/credential.module';
import { PathService } from '../common';

@Module({
    imports: [CredentialModule],
    providers: [AutoFlasherService, PathService],
    exports: [AutoFlasherService],
})
export class AutoFlasherModule {}
