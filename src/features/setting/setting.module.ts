import { Module } from '@nestjs/common';
import { SettingService } from './setting.service';
import { SettingController } from './setting.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { ScheduleSchema } from './schema/schedule.schema';
import { ScheduleService } from './schedule.service';
import { NoticeSchema } from './schema/notice.schema';
import { NoticeService } from './notice.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: collectionsName.Schedule, schema: ScheduleSchema },
      { name: collectionsName.notice, schema: NoticeSchema },
    ]),
  ],
  controllers: [SettingController],
  providers: [SettingService, ScheduleService, NoticeService],
  exports: [SettingService, ScheduleService],
})
export class SettingModule {}
