import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { ClientSession, Model, Types } from 'mongoose';
import { Schedule, ScheduleDocument } from './schema/schedule.schema';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(@InjectModel(collectionsName.schedule) private readonly scheduleModel: Model<Schedule>) {}

  /**
   * CREATE A SCHEDULE FOR AN ADMIN WHEN ADMIN REGISTER
   * @param adminId
   * @param session
   * @returns
   */
  async createSchedule(adminId: Types.ObjectId, session: ClientSession): Promise<Schedule> {
    const schedule = new this.scheduleModel({ admin: adminId });
    return schedule.save({ session });
  }

  /**
   * get the schedule of an admin
   * @param {Types.ObjectId} adminId
   * @returns Promise<Schedule>
   */
  async getSchedule(adminId: Types.ObjectId): Promise<ScheduleDocument> {
    return await this.scheduleModel.findOne({ admin: adminId }).lean<ScheduleDocument>();
  }

  /**
   * update the schedule of an admin
   * @param {Types.ObjectId} adminId
   * @param {Schedule} schedule
   * @returns Promise<Schedule>
   */
  async updateSchedule(adminId: Types.ObjectId, schedule: UpdateScheduleDto): Promise<ScheduleDocument> {
    return this.scheduleModel
      .findOneAndUpdate(
        { admin: adminId },
        {
          $set: schedule,
        },
      )
      .lean<ScheduleDocument>()
      .exec();
  }
}
