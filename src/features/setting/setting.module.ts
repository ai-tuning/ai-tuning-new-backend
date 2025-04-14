import { Module } from '@nestjs/common';
import { SettingController } from './setting.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { ScheduleSchema } from './schema/schedule.schema';
import { ScheduleService } from './schedule.service';
import { NoticeSchema } from './schema/notice.schema';
import { NoticeService } from './notice.service';
import { LogoSchema } from './schema/logo.schema';
import { LogoService } from './logo.service';
import { AdminSchema } from '../admin/schema/admin.schema';
import { MulterModule } from '../common';

@Module({
    imports: [
        MulterModule.register({
            acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
            destination: './public/uploads/images',
            errorMessages: 'Please upload a valid file',
        }),
        MongooseModule.forFeature([
            { name: collectionsName.schedule, schema: ScheduleSchema },
            { name: collectionsName.notice, schema: NoticeSchema },
            { name: collectionsName.logo, schema: LogoSchema },
            { name: collectionsName.admin, schema: AdminSchema },
        ]),
    ],
    controllers: [SettingController],
    providers: [ScheduleService, NoticeService, LogoService],
    exports: [ScheduleService],
})
export class SettingModule {}
