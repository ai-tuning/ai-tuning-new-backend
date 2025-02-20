import { Module } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { AdminSchema } from '../admin/schema/admin.schema';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        schema: AdminSchema,
        name: collectionsName.admin,
      },
    ]),
    AdminModule,
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}
