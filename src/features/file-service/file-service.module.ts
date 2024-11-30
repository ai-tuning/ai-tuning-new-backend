import { Module } from '@nestjs/common';
import { FileServiceService } from './file-service.service';
import { FileServiceController } from './file-service.controller';

@Module({
  controllers: [FileServiceController],
  providers: [FileServiceService],
})
export class FileServiceModule {}
