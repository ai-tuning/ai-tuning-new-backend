import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { EmployeeSchema } from './entities/employee.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: collectionsName.employee, schema: EmployeeSchema }])],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
