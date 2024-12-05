import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { queueNames } from 'src/features/constant';

@Injectable()
export class EmailQueueProducers {
  constructor(@InjectQueue(queueNames.emailQueue) private emailQueue: Queue) {}

  sendMail(data: any) {
    this.emailQueue.add(queueNames.emailQueue, data, {
      removeOnComplete: true,
    });
  }
}
