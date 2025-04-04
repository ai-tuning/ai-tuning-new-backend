import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';

import { EMAIL_TYPE, queueNames } from '../../constant';
import { Injectable } from '@nestjs/common';
import { MailService } from 'src/features/mail/mail.service';

@Injectable()
@Processor(queueNames.emailQueue)
export class EmailQueueConsumer {
  constructor(private readonly mailService: MailService) {}
  @Process({ concurrency: 10, name: queueNames.emailQueue })
  async process(job: Job<unknown>): Promise<any> {
    const data = job.data as any;

    if (data.emailType === EMAIL_TYPE.verifyEmail) {
      await this.mailService.sendLoginCode({ receiver: data.receiver, code: data.code, name: data.name });
    } else if (data.emailType === EMAIL_TYPE.welcomeEmail) {
      await this.mailService.sendWelcomeMail({ receiver: data.receiver, name: data.name });
    } else if (data.emailType === EMAIL_TYPE.resetPasswordEmail) {
      await this.mailService.resetPassword({ receiver: data.receiver, code: data.code, name: data.name });
    } else if (data.emailType === EMAIL_TYPE.fileReady) {
      await this.mailService.fileReady({ receiver: data.receiver, name: data.name, uniqueId: data.uniqueId });
    } else if (data.emailType === EMAIL_TYPE.requestSolution) {
      await this.mailService.requestedForSolution({
        receiver: data.receiver,
        name: data.name,
        uniqueId: data.uniqueId,
      });
    } else if (data.emailType === EMAIL_TYPE.newFileNotification) {
      await this.mailService.newFileUploadAdmin({
        receiver: data.receiver,
        name: data.name,
        uniqueId: data.uniqueId,
      });
    } else if (data.emailType === EMAIL_TYPE.refundFileService) {
      await this.mailService.refundFileService({
        receiver: data.receiver,
        name: data.name,
        uniqueId: data.uniqueId,
        credits: data.credits,
      });
    } else if (data.emailType === EMAIL_TYPE.reopenFileService) {
      await this.mailService.fileServiceReopen({
        receiver: data.receiver,
        name: data.name,
        uniqueId: data.uniqueId,
      });
    } else if (data.emailType === EMAIL_TYPE.openSupportTicket) {
      await this.mailService.ticketOpen({
        receiver: data.receiver,
        name: data.name,
        uniqueId: data.uniqueId,
      });
    } else if (data.emailType === EMAIL_TYPE.closedSupportTicket) {
      await this.mailService.closeSupportTicket({
        receiver: data.receiver,
        name: data.name,
        uniqueId: data.uniqueId,
      });
    } else if (data.emailType === EMAIL_TYPE.reopenSupportTicket) {
      await this.mailService.ticketReopen({
        receiver: data.receiver,
        name: data.name,
        uniqueId: data.uniqueId,
      });
    } else if (data.emailType === EMAIL_TYPE.openSupportTicketAdmin) {
      await this.mailService.newTicketOpenForAdmin({
        receiver: data.receiver,
        name: data.name,
        uniqueId: data.uniqueId,
      });
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job<unknown>, result: any) {}

  @OnQueueFailed()
  onFailed(job: Job<unknown>, error: any) {
    console.log(error);
  }
}
