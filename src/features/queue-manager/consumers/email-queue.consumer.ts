import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';

import { EMAIL_TYPE, queueNames } from '../../constant';
import { Injectable } from '@nestjs/common';
import { MailService } from 'src/features/mail/mail.service';

interface EmailData {
  receiver: string;
  code: string;
  name: string;
  emailType: (typeof EMAIL_TYPE)[keyof typeof EMAIL_TYPE];
}

@Injectable()
@Processor(queueNames.emailQueue)
export class EmailQueueConsumer {
  constructor(private readonly mailService: MailService) {}
  @Process({ concurrency: 10, name: queueNames.emailQueue })
  async process(job: Job<unknown>): Promise<any> {
    const data = job.data as EmailData;

    if (data.emailType === EMAIL_TYPE.verifyEmail) {
      await this.mailService.sendLoginCode(data.receiver, data.code);
    } else if (data.emailType === EMAIL_TYPE.welcomeEmail) {
      await this.mailService.sendWelcomeMail(data);
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job<unknown>, result: any) {}

  @OnQueueFailed()
  onFailed(job: Job<unknown>, error: any) {
    console.log(error);
  }
}
