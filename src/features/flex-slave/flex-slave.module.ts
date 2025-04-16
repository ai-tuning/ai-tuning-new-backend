import { Module } from '@nestjs/common';
import { FlexSlaveService } from './flex-slave.service';
import { FlexSlaveController } from './flex-slave.controller';
import { CredentialModule } from '../credential/credential.module';
import { PathService } from '../common';

@Module({
    imports: [CredentialModule],
    controllers: [FlexSlaveController],
    providers: [FlexSlaveService, PathService],
    exports: [FlexSlaveService],
})
export class FlexSlaveModule {}
