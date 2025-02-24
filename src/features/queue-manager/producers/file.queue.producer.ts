import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { Admin, AdminDocument } from 'src/features/admin/schema/admin.schema';
import { queueNames } from 'src/features/constant';
import { FileService } from 'src/features/file-service/schema/file-service.schema';
import { TempFileService } from 'src/features/file-service/schema/temp-file.schema';

/**
 * Producer are used to inject task to the queue
 */

@Injectable()
export class FileProcessQueueProducers {
  constructor(
    @InjectQueue(queueNames.fileProcessQueue) private fileProcessQueue: Queue,
    @InjectQueue(queueNames.solutionBuildQueue) private solutionBuildQueue: Queue,
  ) {}

  processFile(data: { fileServiceData: FileService; tempFileService: TempFileService; admin: AdminDocument }) {
    this.fileProcessQueue.add(queueNames.fileProcessQueue, data, {
      removeOnComplete: true,
    });
  }

  buildFileProcess(data: {
    fileServiceData: FileService;
    tempFileService: TempFileService;
    admin: Admin;
    data: {
      binFilePath: string;
      outFiles: string[];
      outputPath: string;
    };
  }) {
    this.solutionBuildQueue.add(queueNames.solutionBuildQueue, data, {
      removeOnComplete: true,
    });
  }
}
