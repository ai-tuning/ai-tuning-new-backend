import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { Admin, AdminDocument } from 'src/features/admin/schema/admin.schema';
import { queueNames } from 'src/features/constant';
import { FileService } from 'src/features/file-service/schema/file-service.schema';

/**
 * Producer are used to inject task to the queue
 */

@Injectable()
export class FileProcessQueueProducers {
  constructor(
    @InjectQueue(queueNames.fileProcessQueue) private fileProcessQueue: Queue,
    @InjectQueue(queueNames.fileBuildQueue) private fileBuildQueue: Queue,
  ) {}

  processFile(data: { fileServiceData: FileService; admin: AdminDocument }) {
    this.fileProcessQueue.add(queueNames.fileProcessQueue, data, {
      removeOnComplete: true,
    });
  }

  buildFileProcess(data: {
    fileServiceData: FileService;
    admin: Admin;
    data: {
      binFilePath: string;
      outFiles: string[];
      outputPath: string;
    };
  }) {
    this.fileBuildQueue.add(queueNames.fileBuildQueue, data, {
      removeOnComplete: true,
    });
  }
}
