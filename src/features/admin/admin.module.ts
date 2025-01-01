import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminSchema } from './schema/admin.schema';
import { collectionsName } from '../constant';
import { UserModule } from '../user/user.module';
import { CredentialModule } from '../credential/credential.module';
import { SettingModule } from '../setting/setting.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: collectionsName.admin, schema: AdminSchema }]),
    UserModule,
    CredentialModule,
    SettingModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
