import { Module } from '@nestjs/common';
import { VerificationMailService } from './verification-mail.service';
import { VerificationMailController } from './verification-mail.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { VerificationEmailSchema } from './schema/verification-mail.schema';
import { collectionsName } from 'src/features/constant';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: collectionsName.verificationMail,
        schema: VerificationEmailSchema,
      },
    ]),
  ],
  controllers: [VerificationMailController],
  providers: [VerificationMailService],
  exports: [VerificationMailService],
})
export class VerificationMailModule {}
