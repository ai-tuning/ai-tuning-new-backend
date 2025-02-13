import { Module } from '@nestjs/common';

import { StorageService } from './storage-service.service';
import { MulterModule } from '../common';

@Module({
  imports: [
    MulterModule.register({
      acceptedMimeTypes: ['image/jpeg', 'image/png'],
      destination: './public/uploads/images',
      errorMessages: 'Only image file are allowed.',
    }),
  ],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageServiceModule {}
