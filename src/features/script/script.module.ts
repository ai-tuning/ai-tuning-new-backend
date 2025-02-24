import { forwardRef, Module } from '@nestjs/common';
import { ScriptService } from './script.service';
import { ScriptController } from './script.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { ScriptSchema } from './schema/script.schema';
import { MulterModule, PathService } from '../common';
import { StorageServiceModule } from '../storage-service/storage-service.module';
import { CarModule } from '../car/car.module';
import { CarControllerModule } from '../car-controller/car-controller.module';
import { FileServiceSchema } from '../file-service/schema/file-service.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: collectionsName.script, schema: ScriptSchema },
      { name: collectionsName.fileService, schema: FileServiceSchema },
    ]),
    StorageServiceModule,
    CarModule,
    CarControllerModule,
    MulterModule.register({
      acceptedMimeTypes: ['application/octet-stream'],
      destination: './public/uploads/files',
      errorMessages: 'Only bin file are allowed.',
    }),
  ],
  controllers: [ScriptController],
  providers: [ScriptService, PathService],
  exports: [ScriptService],
})
export class ScriptModule {}
