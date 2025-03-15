import { Module } from '@nestjs/common';
import { MigrationService } from './migration.service';
import { MigrationController } from './migration.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { CustomerModule } from '../customer/customer.module';
import { collectionsName } from '../constant';
import { CustomerSchema } from '../customer/schema/customer.schema';
import { InvoiceModule } from '../invoice/invoice.module';
import { InvoiceSchema } from '../invoice/schema/invoice.schema';
import { CarSchema } from '../car/schema/car.schema';
import { CarControllerSchema } from '../car-controller/schema/car-controller.schema';
import { PathService } from '../common';
import { SolutionSchema } from '../solution/schema/solution.schema';
import { CustomerTypeSchema } from '../customer/schema/customer-type.schema';
import { UserSchema } from '../user/schema/user.schema';
import { FileServiceSchema } from '../file-service/schema/file-service.schema';

@Module({
  imports: [
    AdminModule,
    CustomerModule,
    InvoiceModule,
    MongooseModule.forFeature([
      {
        name: collectionsName.customer,
        schema: CustomerSchema,
      },
      {
        name: collectionsName.invoice,
        schema: InvoiceSchema,
      },
      {
        name: collectionsName.car,
        schema: CarSchema,
      },
      {
        name: collectionsName.controller,
        schema: CarControllerSchema,
      },
      {
        name: collectionsName.solution,
        schema: SolutionSchema,
      },
      {
        name: collectionsName.customerType,
        schema: CustomerTypeSchema,
      },
      {
        name: collectionsName.user,
        schema: UserSchema,
      },
      {
        name: collectionsName.fileService,
        schema: FileServiceSchema,
      },
    ]),
  ],
  controllers: [MigrationController],
  providers: [MigrationService, PathService],
})
export class MigrationModule {}
