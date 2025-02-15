import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { ChatSchema } from './schema/chat.schema';
import { StorageServiceModule } from '../storage-service/storage-service.module';
import { MulterModule } from '../common';

@Module({
  imports: [
    MulterModule.register({
      acceptedMimeTypes: [],
      destination: './public/uploads/files',
      errorMessages: 'Please upload a valid file',
    }),
    MongooseModule.forFeature([{ name: collectionsName.chat, schema: ChatSchema }]),
    StorageServiceModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
