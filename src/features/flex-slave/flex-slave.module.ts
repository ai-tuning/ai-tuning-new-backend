import { Module } from '@nestjs/common';
import { FlexSlaveService } from './flex-slave.service';
import { FlexSlaveController } from './flex-slave.controller';
import { HttpModule } from '@nestjs/axios';
import { CredentialModule } from '../credential/credential.module';
import { PathService } from '../common';

@Module({
    imports: [
        HttpModule.register({
            baseURL: 'https://api.magicmotorsport.com',
            headers: {
                Accept: 'application/json',
            },
        }),
        CredentialModule,
    ],
    controllers: [FlexSlaveController],
    providers: [FlexSlaveService, PathService],
    exports: [FlexSlaveService],
})
export class FlexSlaveModule {}
