import { Job, JobOptions } from 'bull';
import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { collectionsName, queueNames } from '../../constant';
import { Injectable } from '@nestjs/common';
import { CatapushService } from 'src/features/catapush/catapush.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin } from 'src/features/admin/schema/admin.schema';
import { Employee } from 'src/features/employee/schema/employee.schema';

@Injectable()
@Processor(queueNames.catapushMessageQueue)
export class CatapushMessageConsumer {
  constructor(
    @InjectModel(collectionsName.admin) private readonly adminModel: Model<Admin>,
    @InjectModel(collectionsName.employee) private readonly employeeModel: Model<Employee>,
    private readonly catapushService: CatapushService,
  ) {}
  @Process({ concurrency: 10, name: queueNames.catapushMessageQueue })
  async process(job: Job<JobOptions>): Promise<any> {
    const data = job.data as { message: string; adminId: string; phone?: string; messageFor: 'admin' | 'customer' };
    console.log(data);
    const admin = await this.adminModel.findById(data.adminId);

    if (data.messageFor === 'admin') {
      const employees = await this.employeeModel.find({ admin: data.adminId }).lean<Employee[]>();
      if (admin.phone) {
        const phone = admin.countryCode.replace('+', '') + admin.phone;
        await this.catapushService.sendMessages(data.message, phone, admin.companyName);
      }
      for (const employee of employees) {
        if (employee.phone) {
          await this.catapushService.sendMessages(data.message, employee.phone, admin.companyName);
        }
      }
    } else {
      await this.catapushService.sendMessages(data.message, data.phone, admin.companyName);
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job<JobOptions>, result: any) {
    console.log('catapush message sent');
  }

  @OnQueueFailed()
  onFailed(job: Job<unknown>, error: any) {
    console.log(error);
  }
}
