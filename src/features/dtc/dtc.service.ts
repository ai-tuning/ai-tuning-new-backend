import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDtcDto } from './dto/create-dtc.dto';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName, DTC_STATUS, queueNames } from '../constant';
import { Dtc } from './schema/dtc.schema';
import { Model, Types } from 'mongoose';
import { PathService } from '../common';
import path, { join, parse } from 'path';
import * as fs from 'fs';
import * as util from 'util';
import { StorageService } from '../storage-service/storage-service.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

const timeOutAsync = util.promisify(setTimeout);

@Injectable()
export class DtcService {
    constructor(
        @InjectModel(collectionsName.dtc) private readonly dtcModel: Model<Dtc>,
        @InjectQueue(queueNames.dtcQueue) private dtcQueue: Queue,
        private readonly pathService: PathService,
        private readonly storageService: StorageService,
    ) {}

    async create(createDtcDto: CreateDtcDto, file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        console.log(file);
        console.log(createDtcDto);
        const newDtc = new this.dtcModel({
            admin: createDtcDto.admin,
            customer: createDtcDto.customer,
            faultCodes: createDtcDto.faultCodes,
            originalFile: file.filename,
            id: Date.now(),
        });

        const dtc = await newDtc.save();

        const rootPath = this.pathService.getTempFilePath(dtc._id.toString());

        if (!fs.existsSync(rootPath)) {
            fs.mkdirSync(rootPath);
        }

        //move file to temp folder
        await fs.promises.rename(file.path, join(rootPath, file.filename));

        this.dtcQueue.add(queueNames.dtcQueue, dtc._id, {
            removeOnComplete: true,
        });

        return dtc;
    }

    findAll() {
        return this.dtcModel.find().sort({ createdAt: -1 }).lean<Dtc[]>();
    }

    findByCustomer(customerId: Types.ObjectId) {
        return this.dtcModel.find({ customer: customerId }).sort({ createdAt: -1 }).lean<Dtc[]>();
    }

    async dtcProcess(dtcId: Types.ObjectId) {
        const dtc = await this.dtcModel.findByIdAndUpdate(dtcId, { status: DTC_STATUS.IN_PROGRESS });

        // const inPath=this.pathService.
        const parseFile = parse(dtc.originalFile);
        const filename = parseFile.name + '.txt';

        const tempRootPath = this.pathService.getTempFilePath(dtc._id.toString());

        const faultCodeFile = join(tempRootPath, filename);

        console.log('faultCodeFile', faultCodeFile);

        await fs.promises.writeFile(faultCodeFile, dtc.faultCodes);

        const mainFilePath = join(tempRootPath, dtc.originalFile);

        await Promise.all([
            fs.promises.rename(mainFilePath, join(this.pathService.getDtcInputPath(), dtc.originalFile)),
            fs.promises.rename(faultCodeFile, join(this.pathService.getDtcInputPath(), filename)),
        ]);

        const outFileName = dtc.originalFile + ' - DTC ' + dtc.faultCodes.split(',').join(' ');
        console.log('outFileName', outFileName);
        const outFile = path.join(this.pathService.getDtcOutPath(), outFileName);
        console.log('outFile', outFile);

        await timeOutAsync(30000);

        //check file exist
        let retry = 0;
        let fileExist = fs.existsSync(outFile);
        console.log('fileExist', fileExist);
        while (!fileExist) {
            if (retry > 7) {
                break;
            }
            await timeOutAsync(10000);
            console.log('retry');
            fileExist = fs.existsSync(outFile);
            console.log('fileExist', fileExist);
            retry++;
        }

        if (fileExist) {
            //upload file to the s3
            const uploadedData = await this.storageService.upload(dtc._id.toString(), {
                name: outFileName,
                path: outFile,
            });

            await this.dtcModel.findByIdAndUpdate(dtcId, {
                status: DTC_STATUS.COMPLETED,
                outputFile: {
                    key: uploadedData,
                    originalname: outFileName,
                    uniqueName: outFile,
                },
            });
        } else {
            throw new Error('DTC file not found');
        }

        return { dtcId: dtcId, outFileName };
    }
}
