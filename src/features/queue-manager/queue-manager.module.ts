import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { queueNames } from '../constant';
import { EmailQueueProducers } from './producers/email-queue.producers';
import { MailModule } from '../mail/mail.module';
import { EmailQueueConsumer } from './consumers/email-queue.consumer';
import { FileProcessQueueProducers } from './producers/file.queue.producer';
import { FileServiceModule } from '../file-service/file-service.module';
import { FileProcessQueueConsumer } from './consumers/file-process.queue.consumer';
import { FileBuildQueueConsumer } from './consumers/file-build.queue.consumer';

const queues = [
  { name: queueNames.emailQueue, defaultJobOptions: { removeOnComplete: true, removeOnFail: true, attempts: 2 } },
  { name: queueNames.activityQueue, defaultJobOptions: { removeOnComplete: true, removeOnFail: true, attempts: 2 } },
  { name: queueNames.fileProcessQueue, defaultJobOptions: { removeOnComplete: true, removeOnFail: true } },
  {
    name: queueNames.solutionBuildQueue,
    defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
  },
  {
    name: queueNames.notificationQueue,
    defaultJobOptions: { removeOnComplete: true, removeOnFail: true, attempts: 2 },
  },
];

@Module({
  imports: [BullModule.registerQueue(...queues), MailModule, forwardRef(() => FileServiceModule)],
  providers: [
    EmailQueueProducers,
    EmailQueueConsumer,
    FileProcessQueueProducers,
    FileProcessQueueConsumer,
    FileBuildQueueConsumer,
  ],
  exports: [EmailQueueProducers, FileProcessQueueProducers],
})
export class QueueManagerModule {}
