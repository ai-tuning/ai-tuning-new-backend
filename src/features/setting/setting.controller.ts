import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SettingService } from './setting.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { ScheduleService } from './schedule.service';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser } from '../common';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Controller('settings')
export class SettingController {
  constructor(
    private readonly settingService: SettingService,
    private readonly scheduleService: ScheduleService,
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
}
