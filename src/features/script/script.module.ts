import { Module } from '@nestjs/common';
import { ScriptService } from './script.service';
import { ScriptController } from './script.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { ScriptSchema } from './schema/script.schema';
import { FileServiceModule } from '../file-service/file-service.module';
import { MulterModule, PathService } from '../common';
import { StorageServiceModule } from '../storage-service/storage-service.module';
import { CarModule } from '../car/car.module';
import { CarControllerModule } from '../car-controller/car-controller.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: collectionsName.script, schema: ScriptSchema }]),
    FileServiceModule,
    StorageServiceModule,
    CarModule,
    CarControllerModule,
    MulterModule.register({
      acceptedMimeTypes: ['application/octet-stream'],
      destination: './public/uploads/images',
      errorMessages: 'Only bin file are allowed.',
    }),
  ],
  controllers: [ScriptController],
  providers: [ScriptService, PathService],
})
export class ScriptModule {}
