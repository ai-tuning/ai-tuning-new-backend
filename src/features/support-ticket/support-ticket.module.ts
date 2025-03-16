import { Module } from '@nestjs/common';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicketController } from './support-ticket.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { SupportTicketSchema } from './schema/support-ticket.schema';
import { MulterModule } from '../common';
import { StorageServiceModule } from '../storage-service/storage-service.module';
import { ChatSchema } from '../chat/schema/chat.schema';
import { QueueManagerModule } from '../queue-manager/queue-manager.module';
import { CustomerSchema } from '../customer/schema/customer.schema';

@Module({
  imports: [
    MulterModule.register({
      acceptedMimeTypes: [],
      destination: './public/uploads/files',
      errorMessages: 'Please upload a valid file',
    }),
    MongooseModule.forFeature([
      { name: collectionsName.supportTicket, schema: SupportTicketSchema },
      { name: collectionsName.chat, schema: ChatSchema },
      { name: collectionsName.customer, schema: CustomerSchema },
    ]),
    StorageServiceModule,
    QueueManagerModule,
  ],
  controllers: [SupportTicketController],
  providers: [SupportTicketService],
})
export class SupportTicketModule {}
