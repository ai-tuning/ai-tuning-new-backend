import { Module } from '@nestjs/common';
import { FileServiceService } from './file-service.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FileServiceSchema } from './schema/file-service.schema';
import { collectionsName } from '../constant';
import { FileServiceController } from './file-service.controller';
import { CarModule } from '../car/car.module';
import { CarControllerModule } from '../car-controller/car-controller.module';
import { TempFileServiceSchema } from './schema/temp-file.schema';
import { MulterModule, PathService } from '../common';
import { SolutionModule } from '../solution/solution.module';
import { Kess3Module } from '../kess3/kess3.module';
import { AutoTunerModule } from '../auto-tuner/auto-tuner.module';
import { AutoFlasherModule } from '../auto-flasher/auto-flasher.module';
import { CustomerModule } from '../customer/customer.module';
import { PricingModule } from '../pricing/pricing.module';
import { StorageServiceModule } from '../storage-service/storage-service.module';
import { QueueManagerModule } from '../queue-manager/queue-manager.module';
import { ChatModule } from '../chat/chat.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    MulterModule.register({
      acceptedMimeTypes: [],
      destination: './public/uploads/files',
      errorMessages: 'Please upload a valid file',
    }),
    MongooseModule.forFeature([
      { name: collectionsName.fileService, schema: FileServiceSchema },
      { name: collectionsName.tempFileService, schema: TempFileServiceSchema },
    ]),
    CustomerModule,
    AdminModule,
    CarModule,
    CarControllerModule,
    SolutionModule,
    Kess3Module,
    AutoTunerModule,
    AutoFlasherModule,
    PricingModule,
    StorageServiceModule,
    QueueManagerModule,
    ChatModule,
  ],
  controllers: [FileServiceController],
  providers: [FileServiceService, PathService],
  exports: [FileServiceService],
})
export class FileServiceModule {}
