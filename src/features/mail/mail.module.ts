import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { CredentialModule } from '../credential/credential.module';

@Module({
    imports: [CredentialModule],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
