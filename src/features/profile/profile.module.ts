import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { CustomerModule } from '../customer/customer.module';
import { AdminModule } from '../admin/admin.module';
import { EmployeeModule } from '../employee/employee.module';
import { StorageServiceModule } from '../storage-service/storage-service.module';
import { MulterModule } from '../common';
import { EmployeeRoleModule } from '../employee-role/employee-role.module';

@Module({
  imports: [
    AdminModule,
    EmployeeModule,
    CustomerModule,
    EmployeeRoleModule,
    StorageServiceModule,
    MulterModule.register({
      acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
      destination: './public/uploads/images',
      errorMessages: 'Only image file are allowed.',
    }),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
