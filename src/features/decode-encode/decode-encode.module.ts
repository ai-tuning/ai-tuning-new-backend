import { Module } from '@nestjs/common';
import { DecodeEncodeService } from './decode-encode.service';
import { DecodeEncodeController } from './decode-encode.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { DecodeEncodeSchema } from './schema/decode-encode.schema';
import { Kess3Module } from '../kess3/kess3.module';
import { AutoTunerModule } from '../auto-tuner/auto-tuner.module';
import { AutoFlasherModule } from '../auto-flasher/auto-flasher.module';
import { FlexSlaveModule } from '../flex-slave/flex-slave.module';
import { MulterModule, PathService } from '../common';
import { StorageServiceModule } from '../storage-service/storage-service.module';
import { AdminModule } from '../admin/admin.module';

@Module({
    imports: [
        MulterModule.register({
            acceptedMimeTypes: [],
            destination: './public/uploads/files',
            errorMessages: 'Please upload a valid file',
        }),
        MongooseModule.forFeature([
            {
                name: collectionsName.decodeEncode,
                schema: DecodeEncodeSchema,
            },
        ]),
        StorageServiceModule,
        Kess3Module,
        AutoTunerModule,
        AutoFlasherModule,
        FlexSlaveModule,
        AdminModule,
    ],
    controllers: [DecodeEncodeController],
    providers: [DecodeEncodeService, PathService],
})
export class DecodeEncodeModule {}
