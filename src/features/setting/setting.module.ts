import { Module } from '@nestjs/common';
import { SettingService } from './setting.service';
import { SettingController } from './setting.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { ScheduleSchema } from './schema/schedule.schema';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: collectionsName.Schedule, schema: ScheduleSchema }])],
  controllers: [SettingController],
  providers: [SettingService, ScheduleService],
  exports: [SettingService, ScheduleService],
})
export class SettingModule {}
