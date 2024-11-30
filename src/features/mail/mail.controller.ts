import { Controller, Get } from '@nestjs/common';
import { MailService } from './mail.service';
import { Public } from '../common';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Public()
  @Get()
  async sendAuthMail() {
    await this.mailService.sendAuthMail('jubaidhossain66@gmail.com', '123456');
    return { message: 'Mail Send to jubaidhossain66@gmail.com' };
  }
}
