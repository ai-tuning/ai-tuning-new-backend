import { Job } from 'bull';
import { Types } from 'mongoose';
import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';

import { queueNames, WinOLS_STATUS } from '../../constant';
import { Injectable } from '@nestjs/common';
import { FileServiceService } from 'src/features/file-service/file-service.service';
import { FileService } from 'src/features/file-service/schema/file-service.schema';
import { Admin } from 'src/features/admin/schema/admin.schema';

@Injectable()
@Processor(queueNames.fileBuildQueue)
export class FileBuildQueueConsumer {
  constructor(private readonly fileService: FileServiceService) {}
  @Process({ concurrency: 10, name: queueNames.fileBuildQueue })
  async process(job: Job<unknown>): Promise<any> {
    const data = job.data as {
      fileServiceData: FileService;
      admin: Admin;
      data: {
        binFilePath: string;
        outFiles: string[];
        outputPath: string;
      };
    };
    console.log('build consumer data==>', data);
    return await this.fileService.buildFileProcess(data.fileServiceData, data.admin, data.data);
  }

  @OnQueueCompleted()
  onCompleted(_job: Job<unknown>, result: any) {
    console.log('Build completed');
    console.log(result);
  }

  @OnQueueFailed()
  async onFailed(job: Job<unknown>, error: any) {
    console.log(error);
    const data = job.data as { fileServiceData: FileService; admin: Admin };

    await this.fileService.updateWinolsStatus(data.fileServiceData._id as Types.ObjectId, WinOLS_STATUS.WinOLS_FAILED);
  }
}
