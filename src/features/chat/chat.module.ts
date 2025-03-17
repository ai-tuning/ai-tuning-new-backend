import { forwardRef, Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { ChatSchema } from './schema/chat.schema';
import { StorageServiceModule } from '../storage-service/storage-service.module';
import { MulterModule } from '../common';
import { FileServiceSchema } from '../file-service/schema/file-service.schema';
import { SupportTicketSchema } from '../support-ticket/schema/support-ticket.schema';
import { QueueManagerModule } from '../queue-manager/queue-manager.module';
import { CustomerSchema } from '../customer/schema/customer.schema';
import { Kess3Module } from '../kess3/kess3.module';
import { AutoTunerModule } from '../auto-tuner/auto-tuner.module';
import { AutoFlasherModule } from '../auto-flasher/auto-flasher.module';
import { EmployeeSchema } from '../employee/schema/employee.schema';

@Module({
  imports: [
    MulterModule.register({
      acceptedMimeTypes: [],
      destination: './public/uploads/files',
      errorMessages: 'Please upload a valid file',
    }),
    MongooseModule.forFeature([
      { name: collectionsName.chat, schema: ChatSchema },
      { name: collectionsName.fileService, schema: FileServiceSchema },
      { name: collectionsName.supportTicket, schema: SupportTicketSchema },
      { name: collectionsName.customer, schema: CustomerSchema },
      { name: collectionsName.employee, schema: EmployeeSchema },
    ]),
    StorageServiceModule,
    forwardRef(() => QueueManagerModule),
    Kess3Module,
    AutoTunerModule,
    AutoFlasherModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
