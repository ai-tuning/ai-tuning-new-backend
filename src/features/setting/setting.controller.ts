import { Controller, Get, Body, Patch, Delete, Query, UseInterceptors, UploadedFile } from '@nestjs/common';

import { ScheduleService } from './schedule.service';
import { AuthUser } from '../common/decorator/get-auth-user.decorator';
import { IAuthUser, Public } from '../common';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { NoticeService } from './notice.service';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { LogoService } from './logo.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Types } from 'mongoose';

@Controller('settings')
export class SettingController {
    constructor(
        private readonly scheduleService: ScheduleService,
        private readonly noticeService: NoticeService,
        private readonly logoService: LogoService,
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
    async getSchedule(@AuthUser() authUser: IAuthUser) {
        const data = await this.scheduleService.getSchedule(authUser.admin);
        return data;
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
     * ================================================
     * Notice Services
     * ================================================
     */
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

    /**
     * ================================================
     * Logo Services
     * ================================================

    /**
     * Public API for get logo
     * @param domain
     * @returns
     */
    @Public()
    @Get('logo')
    getLogo(@Query('domain') domain: string) {
        return this.logoService.getLogo(domain);
    }

    /**
     * api for upload logo admin or super admin only
     * @param body
     * @param file
     * @returns
     */
    @UseInterceptors(FileInterceptor('file'))
    @Patch('logo')
    async uploadLightLogo(
        @Body() body: { adminId: Types.ObjectId; logoType: string },
        @UploadedFile() file: Express.Multer.File,
    ) {
        console.log(body);
        const data = await this.logoService.uploadLogo(body.adminId, body.logoType, file);
        return { data, message: 'Logo uploaded successfully' };
    }
}
