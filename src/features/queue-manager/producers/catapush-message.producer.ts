import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { Types } from 'mongoose';
import { queueNames } from 'src/features/constant';

/**
 * Producer are used to inject task to the queue
 */

@Injectable()
export class CatapushMessageProducer {
  constructor(@InjectQueue(queueNames.catapushMessageQueue) private emailQueue: Queue) {}

  sendCatapushMessage(adminId: Types.ObjectId, message: string, messageFor: 'admin' | 'customer', phone?: string) {
    this.emailQueue.add(
      queueNames.catapushMessageQueue,
      { adminId, message, messageFor, phone },
      {
        removeOnComplete: true,
      },
    );
  }
}
