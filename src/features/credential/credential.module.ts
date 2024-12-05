import { Module } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CredentialController } from './credential.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { CredentialSchema } from './schema/credential.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: collectionsName.credential, schema: CredentialSchema },
    ]),
  ],
  controllers: [CredentialController],
  providers: [CredentialService],
  exports: [CredentialService],
})
export class CredentialModule {}
