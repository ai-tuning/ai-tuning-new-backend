import { Job } from 'bull';
import { Types } from 'mongoose';
import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';

import { queueNames } from '../../constant';
import { Injectable } from '@nestjs/common';
import { DtcService } from 'src/features/dtc/dtc.service';

@Injectable()
@Processor(queueNames.dtcQueue)
export class DtcQueueConsumer {
    constructor(private readonly dtcService: DtcService) {}
    @Process({ concurrency: 1, name: queueNames.dtcQueue })
    async process(job: Job<unknown>): Promise<any> {
        const dtcId = job.data as Types.ObjectId;
        console.log('dtcId==>', dtcId);
        return await this.dtcService.dtcProcess(dtcId);
    }

    @OnQueueCompleted()
    onCompleted(_job: Job<unknown>, result: any) {
        console.log('DTC completed');
        console.log(result);
    }

    @OnQueueFailed()
    async onFailed(_job: Job<unknown>, error: any) {
        console.log(error);
    }
}
