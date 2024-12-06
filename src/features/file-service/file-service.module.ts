import { Module } from '@nestjs/common';
import { FileServiceService } from './file-service.service';

@Module({
  providers: [FileServiceService],
})
export class FileServiceModule {}
