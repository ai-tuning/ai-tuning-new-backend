import { Controller } from '@nestjs/common';
import { VerificationMailService } from './verification-mail.service';

@Controller('verification-mail')
export class VerificationMailController {
  constructor(private readonly verificationMailService: VerificationMailService) {}
}
