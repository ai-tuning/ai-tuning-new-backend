import { Module } from '@nestjs/common';
import { FileServiceService } from './file-service.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FileServiceSchema } from './schema/file-service.schema';
import { collectionsName } from '../constant';
import { FileServiceController } from './file-service.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: collectionsName.fileService, schema: FileServiceSchema }])],
  controllers: [FileServiceController],
  providers: [FileServiceService],
  exports: [FileServiceService],
})
export class FileServiceModule {}
