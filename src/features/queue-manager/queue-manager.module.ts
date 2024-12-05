import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { queueNames } from '../constant';
import { EmailQueueProducers } from './producers/email-queue.producers';
import { MailModule } from '../mail/mail.module';
import { EmailQueueConsumer } from './consumers/email-queue.consumer';

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
  imports: [BullModule.registerQueue(...queues), MailModule],
  providers: [EmailQueueProducers, EmailQueueConsumer],
  exports: [EmailQueueProducers],
})
export class QueueManagerModule {}
