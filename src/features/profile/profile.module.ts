import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { CustomerModule } from '../customer/customer.module';
import { AdminModule } from '../admin/admin.module';
import { EmployeeModule } from '../employee/employee.module';

@Module({
  imports: [CustomerModule, AdminModule, EmployeeModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
