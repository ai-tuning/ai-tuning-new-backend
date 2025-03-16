import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName, FILE_SERVICE_STATUS, PAYMENT_STATUS } from '../constant';
import { Model, Types } from 'mongoose';
import { Invoice } from '../invoice/schema/invoice.schema';
import {
  endOfMonth,
  endOfToday,
  endOfWeek,
  endOfYear,
  endOfYesterday,
  startOfMonth,
  startOfToday,
  startOfWeek,
  startOfYear,
  startOfYesterday,
  subWeeks,
  subYears,
} from 'date-fns';
import { FileService } from '../file-service/schema/file-service.schema';
import { SupportTicket } from '../support-ticket/schema/support-ticket.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(collectionsName.invoice) private readonly invoiceModel: Model<Invoice>,
    @InjectModel(collectionsName.fileService) private readonly fileServiceModel: Model<FileService>,
    @InjectModel(collectionsName.supportTicket) private readonly supportTicketModel: Model<SupportTicket>,
  ) {}

  async getDownloadSummery(adminId: Types.ObjectId, customerId?: string) {
    // Your code here
    const currentDate = new Date();

    const todayStartTime = startOfToday();
    const todayEndTime = endOfToday();

    const yesterdayStartTime = startOfYesterday();
    const yesterdayEndTime = endOfYesterday();

    const firstDayOfWeek = startOfWeek(currentDate, {
      weekStartsOn: 1,
    });
    const lastDayOfWeek = endOfWeek(currentDate, { weekStartsOn: 1 });

    const previousWeekStart = startOfWeek(subWeeks(firstDayOfWeek, 1));
    const previousWeekEnd = endOfWeek(subWeeks(lastDayOfWeek, 1));

    const startCurrentMonth = startOfMonth(currentDate);
    const endCurrentMonth = endOfMonth(currentDate);

    const startPreviousMonth = startOfMonth(subYears(startCurrentMonth, 1));
    const endPreviousMonth = endOfMonth(subYears(endCurrentMonth, 1));

    const startCurrentYear = startOfYear(currentDate);
    const endCurrentYear = endOfYear(currentDate);

    const startPreviousYear = startOfYear(subYears(startCurrentYear, 1));
    const endEndPreviousYear = endOfYear(subYears(endCurrentYear, 1));

    const todayDownloads = await this.calculateDownload(todayStartTime, todayEndTime, adminId, customerId);
    const yesterdayDownloads = await this.calculateDownload(yesterdayStartTime, yesterdayEndTime, adminId, customerId);
    const currentWeekDownloads = await this.calculateDownload(firstDayOfWeek, lastDayOfWeek, adminId, customerId);
    const previousWeekDownloads = await this.calculateDownload(previousWeekStart, previousWeekEnd, adminId, customerId);
    const currentMonthDownloads = await this.calculateDownload(startCurrentMonth, endCurrentMonth, adminId, customerId);
    const previousMonthDownloads = await this.calculateDownload(
      startPreviousMonth,
      endPreviousMonth,
      adminId,
      customerId,
    );
    const currentYearDownloads = await this.calculateDownload(startCurrentYear, endCurrentYear, adminId, customerId);
    const previousYearDownloads = await this.calculateDownload(
      startPreviousYear,
      endEndPreviousYear,
      adminId,
      customerId,
    );

    return {
      todayDownloads: todayDownloads.length ? todayDownloads[0].count : 0,
      yesterdayDownloads: yesterdayDownloads.length ? yesterdayDownloads[0].count : 0,
      currentWeekDownloads: currentWeekDownloads.length ? currentWeekDownloads[0].count : 0,
      previousWeekDownloads: previousWeekDownloads.length ? previousWeekDownloads[0].count : 0,
      currentMonthDownloads: currentMonthDownloads.length ? currentMonthDownloads[0].count : 0,
      previousMonthDownloads: previousMonthDownloads.length ? previousMonthDownloads[0].count : 0,
      currentYearDownloads: currentYearDownloads.length ? currentYearDownloads[0].count : 0,
      previousYearDownloads: previousYearDownloads.length ? previousYearDownloads[0].count : 0,
    };
  }

  private async calculateDownload(startDate: Date, endDate: Date, adminId: Types.ObjectId, customerId?: string) {
    const query = {
      admin: new Types.ObjectId(adminId),
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
      $or: [
        {
          status: FILE_SERVICE_STATUS.COMPLETED,
        },
        {
          status: FILE_SERVICE_STATUS.CLOSED,
        },
      ],
    };

    if (customerId) {
      query['customer'] = new Types.ObjectId(customerId);
    }
    return this.fileServiceModel.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async getEachMonthDownloadSummery(adminId: Types.ObjectId, customerId?: string) {
    const currentDate = new Date();

    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);

    const results = await this.fileServiceModel.aggregate([
      {
        $match: {
          admin: new Types.ObjectId(adminId),
          ...(customerId && { customer: new Types.ObjectId(customerId) }),
          createdAt: {
            $gte: yearStart,
            $lt: yearEnd,
          },
          $or: [
            {
              status: FILE_SERVICE_STATUS.COMPLETED,
            },
            {
              status: FILE_SERVICE_STATUS.CLOSED,
            },
          ],
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const allMonths = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const finalResults = allMonths.map((month, index) => {
      const count = results.find((item) => item._id === index + 1);
      return {
        month,
        count: count ? count.count : 0,
      };
    });
    return finalResults;
  }

  async getEachMonthSalesSummery(adminId: Types.ObjectId) {
    const currentDate = new Date();

    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);

    const results = await this.invoiceModel.aggregate([
      {
        $match: {
          admin: new Types.ObjectId(adminId),
          createdAt: {
            $gte: yearStart,
            $lt: yearEnd,
          },
          status: PAYMENT_STATUS.PAID,
          customer: {
            $exists: true,
          },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalSales: { $sum: '$grandTotal' },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
    console.log(results);
    const allMonths = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const finalResults = allMonths.map((month, index) => {
      const foundItem = results.find((item) => item._id === index + 1);
      return {
        month,
        totalSales: foundItem ? foundItem.totalSales : 0,
      };
    });

    return finalResults;
  }

  //this function count the file services and tickets of an admin which status OPEN/NEW
  async countTicketsAndFileService(adminId: Types.ObjectId) {
    const fileServiceCount = await this.fileServiceModel
      .countDocuments({ admin: adminId, status: { $in: [FILE_SERVICE_STATUS.NEW, FILE_SERVICE_STATUS.OPEN] } })
      .exec();
    const ticketCount = await this.supportTicketModel
      .countDocuments({ admin: adminId, status: { $in: [FILE_SERVICE_STATUS.NEW, FILE_SERVICE_STATUS.OPEN] } })
      .exec();
    return { fileServiceCount, ticketCount };
  }
}
