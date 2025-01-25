import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { Notice, NoticeDocument } from './schema/notice.schema';
import { Model, Types } from 'mongoose';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Injectable()
export class NoticeService {
  constructor(@InjectModel(collectionsName.notice) private readonly noticeModel: Model<Notice>) {}

  async getNotice(adminId: Types.ObjectId): Promise<NoticeDocument> {
    return await this.noticeModel.findOne({ admin: adminId }).lean<NoticeDocument>();
  }

  async updateNotice(adminId: Types.ObjectId, notice: UpdateNoticeDto): Promise<NoticeDocument> {
    return await this.noticeModel
      .findOneAndUpdate(
        { admin: adminId },
        {
          $set: notice,
        },
        {
          upsert: true,
        },
      )
      .lean<NoticeDocument>()
      .exec();
  }

  async deleteNotice(adminId: Types.ObjectId): Promise<NoticeDocument> {
    return this.noticeModel.findOneAndDelete({ admin: adminId }).lean<NoticeDocument>().exec();
  }
}
