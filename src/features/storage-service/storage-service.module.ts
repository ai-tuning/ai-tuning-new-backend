import { Module } from '@nestjs/common';

import { StorageServiceService } from './storage-service.service';
import { StorageServiceController } from './storage-service.controller';
import { MulterModule } from '../common';

@Module({
  imports: [
    MulterModule.register({
      acceptedMimeTypes: ['image/jpeg', 'image/png'],
      destination: './public/uploads/images',
      errorMessages: 'Only image file are allowed.',
    }),
  ],
  controllers: [StorageServiceController],
  providers: [StorageServiceService],
})
export class StorageServiceModule {}
