import { Module } from '@nestjs/common';
import { EmployeeRoleService } from './employee-role.service';
import { EmployeeRoleController } from './employee-role.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { EmployeeRoleSchema } from './schema/employee-role.schema';
import { PermissionSchema } from './schema/permission.schema';
import { EmployeeSchema } from '../employee/schema/employee.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: collectionsName.employeeRole, schema: EmployeeRoleSchema },
      { name: collectionsName.permission, schema: PermissionSchema },
      { name: collectionsName.employee, schema: EmployeeSchema },
    ]),
  ],
  controllers: [EmployeeRoleController],
  providers: [EmployeeRoleService],
  exports: [EmployeeRoleService],
})
export class EmployeeRoleModule {}
