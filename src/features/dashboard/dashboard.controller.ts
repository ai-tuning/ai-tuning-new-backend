import { Types } from 'mongoose';
import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('download-summery')
  async getWeeklyDownloadForAdmin(@Query('adminId') adminId: Types.ObjectId, @Query('customerId') customerId: string) {
    return await this.dashboardService.getDownloadSummery(adminId, customerId);
  }

  @Get('each-month-download-summery')
  async getEachMonthDownloadSummery(
    @Query('adminId') adminId: Types.ObjectId,
    @Query('customerId') customerId: string,
  ) {
    return await this.dashboardService.getEachMonthDownloadSummery(adminId, customerId);
  }

  @Get('each-month-sales-summery')
  async getEachMonthSalesSummery(@Query('adminId') adminId: Types.ObjectId) {
    return await this.dashboardService.getEachMonthSalesSummery(adminId);
  }
}
