import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { collectionsName, queueNames } from '../constant';
import { EmailQueueProducers } from './producers/email-queue.producers';
import { MailModule } from '../mail/mail.module';
import { EmailQueueConsumer } from './consumers/email-queue.consumer';
import { FileProcessQueueProducers } from './producers/file.queue.producer';
import { FileServiceModule } from '../file-service/file-service.module';
import { FileProcessQueueConsumer } from './consumers/file-process.queue.consumer';
import { FileBuildQueueConsumer } from './consumers/file-build.queue.consumer';
import { CatapushMessageProducer } from './producers/catapush-message.producer';
import { CatapushMessageConsumer } from './consumers/catapush-message.consumer';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminSchema } from '../admin/schema/admin.schema';
import { EmployeeRoleSchema } from '../employee-role/schema/employee-role.schema';
import { CatapushModule } from '../catapush/catapush.module';

const queues = [
  { name: queueNames.emailQueue, defaultJobOptions: { removeOnComplete: true, removeOnFail: true, attempts: 2 } },
  { name: queueNames.activityQueue, defaultJobOptions: { removeOnComplete: true, removeOnFail: true, attempts: 2 } },
  { name: queueNames.fileProcessQueue, defaultJobOptions: { removeOnComplete: true, removeOnFail: true } },
  {
    name: queueNames.fileBuildQueue,
    defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
  },
  {
    name: queueNames.catapushMessageQueue,
    defaultJobOptions: { removeOnComplete: true, removeOnFail: true, attempts: 2 },
  },
];

@Module({
  imports: [
    BullModule.registerQueue(...queues),
    MailModule,
    forwardRef(() => FileServiceModule),
    MongooseModule.forFeature([
      {
        name: collectionsName.admin,
        schema: AdminSchema,
      },
      {
        name: collectionsName.employee,
        schema: EmployeeRoleSchema,
      },
    ]),
    CatapushModule,
  ],
  providers: [
    EmailQueueProducers,
    EmailQueueConsumer,
    FileProcessQueueProducers,
    FileProcessQueueConsumer,
    FileBuildQueueConsumer,
    CatapushMessageProducer,
    CatapushMessageConsumer,
  ],
  exports: [EmailQueueProducers, FileProcessQueueProducers, CatapushMessageProducer],
})
export class QueueManagerModule {}
