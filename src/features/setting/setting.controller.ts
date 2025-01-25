import { Controller, Get, Body, Patch, Delete } from '@nestjs/common';
import { SettingService } from './setting.service';

import { ScheduleService } from './schedule.service';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { NoticeService } from './notice.service';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Controller('settings')
export class SettingController {
  constructor(
    private readonly settingService: SettingService,
    private readonly scheduleService: ScheduleService,
    private readonly noticeService: NoticeService,
  ) {}

  /**
   * ================================================
   * Schedule Services
   * ================================================
   */
  /**
   * Get the schedule of an admin
   * @param authUser
   * @returns
   */
  @Get('schedule')
  getSchedule(@AuthUser() authUser: IAuthUser) {
    console.log(authUser);
    return this.scheduleService.getSchedule(authUser.admin);
  }

  /**
   * Update the schedule of an admin
   * @param authUser
   * @param schedule
   * @returns
   */
  @Patch('schedule')
  async updateSchedule(@Body() schedule: UpdateScheduleDto) {
    const data = await this.scheduleService.updateSchedule(schedule.admin, schedule);
    return { message: 'Schedule updated successfully', data };
  }

  /**
   * GET NOTICE OF AN ADMIN
   * @param authUser
   * @returns
   */
  @Get('notice')
  getNotice(@AuthUser() authUser: IAuthUser) {
    return this.noticeService.getNotice(authUser.admin);
  }

  /**
   * UPDATE THE NOTICE
   * @param notice
   * @returns
   */
  @Patch('notice')
  async updateNotice(@Body() notice: UpdateNoticeDto) {
    const data = await this.noticeService.updateNotice(notice.admin, notice);
    return { message: 'Notice updated successfully', data };
  }

  /**
   * Delete THE NOTICE
   * @param authUser
   * @returns
   */
  @Delete('notice')
  async deleteNotice(@AuthUser() authUser: IAuthUser) {
    const data = await this.noticeService.deleteNotice(authUser.admin);
    return { message: 'Notice deleted successfully', data };
  }
}
