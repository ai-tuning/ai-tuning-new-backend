import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';

import { queueNames, WinOLS_STATUS } from '../../constant';
import { Injectable } from '@nestjs/common';
import { FileServiceService } from 'src/features/file-service/file-service.service';
import { FileService } from 'src/features/file-service/schema/file-service.schema';
import { Admin } from 'src/features/admin/schema/admin.schema';
import { FileProcessQueueProducers } from '../producers/file.queue.producer';
import { Types } from 'mongoose';
import { TempFileService } from 'src/features/file-service/schema/temp-file.schema';

@Injectable()
@Processor(queueNames.fileProcessQueue)
export class FileProcessQueueConsumer {
    constructor(
        private readonly fileService: FileServiceService,
        private readonly fileQueueProducers: FileProcessQueueProducers,
    ) {}
    @Process({ concurrency: 10, name: queueNames.fileProcessQueue })
    async process(job: Job<unknown>): Promise<any> {
        const data = job.data as { fileServiceData: FileService; tempFileService: TempFileService; admin: Admin };
        const result = await this.fileService.fileProcess(data.fileServiceData, data.admin);
        return result;
    }

    @OnQueueCompleted()
    onCompleted(job: Job<unknown>, result: any) {
        const data = job.data as { fileServiceData: FileService; tempFileService: TempFileService; admin: Admin };
        this.fileQueueProducers.buildFileProcess({
            fileServiceData: data.fileServiceData,
            admin: data.admin,
            data: result,
        });
    }

    @OnQueueFailed()
    async onFailed(job: Job<unknown>, error: any) {
        console.log(error);
        const data = job.data as { fileServiceData: FileService; admin: Admin };
        await this.fileService.updateWinolsStatus(
            data.fileServiceData._id as Types.ObjectId,
            WinOLS_STATUS.WinOLS_FAILED,
        );
    }
}
