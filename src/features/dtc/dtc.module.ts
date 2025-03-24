import { Module } from '@nestjs/common';
import { DtcService } from './dtc.service';
import { DtcController } from './dtc.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DtcSchema } from './schema/dtc.schema';
import { collectionsName, queueNames } from '../constant';
import { MulterModule, PathService } from '../common';
import { StorageServiceModule } from '../storage-service/storage-service.module';
import { BullModule } from '@nestjs/bull';

@Module({
    imports: [
        MulterModule.register({
            acceptedMimeTypes: [],
            destination: './public/uploads/files',
            errorMessages: 'Please upload a valid file',
        }),
        MongooseModule.forFeature([
            {
                name: collectionsName.dtc,
                schema: DtcSchema,
            },
        ]),
        BullModule.registerQueue({
            name: queueNames.dtcQueue,
            defaultJobOptions: { removeOnComplete: true, removeOnFail: true, attempts: 1 },
        }),
        StorageServiceModule,
    ],
    controllers: [DtcController],
    providers: [DtcService, PathService],
    exports: [DtcService],
})
export class DtcModule {}
