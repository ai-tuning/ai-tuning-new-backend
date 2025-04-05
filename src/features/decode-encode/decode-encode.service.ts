import { existsSync, unlinkSync } from 'fs';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DecodeDto } from './dto/decode.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as shortid from 'shortid';

import { collectionsName, SLAVE_TYPE } from '../constant';
import { DecodeEncode } from './schema/decode-encode.schema';
import { Kess3Service } from '../kess3/kess3.service';
import { AutoTunerService } from '../auto-tuner/auto-tuner.service';
import { AutoFlasherService } from '../auto-flasher/auto-flasher.service';
import { FlexSlaveService } from '../flex-slave/flex-slave.service';
import { StorageService } from '../storage-service/storage-service.service';
import { PathService } from '../common';
import { AdminService } from '../admin/admin.service';
import { basename } from 'path';

@Injectable()
export class DecodeEncodeService {
    constructor(
        @InjectModel(collectionsName.decodeEncode) private readonly decodeEncodeModel: Model<DecodeEncode>,
        private readonly storageService: StorageService,
        private readonly pathService: PathService,
        private readonly adminService: AdminService,

        private readonly kess3Service: Kess3Service,
        private readonly autoTunerService: AutoTunerService,
        private readonly autoFlasherService: AutoFlasherService,
        private readonly flexSlaveService: FlexSlaveService,
    ) {}

    async decodeSlave(decodeDto: DecodeDto, file: Express.Multer.File) {
        if (!file) throw new BadRequestException('Please provide a file');

        let decodedFilePath = '';
        let decodedFileName = '';
        let originalKey = '';
        let decodedKey = '';
        let dirName = '';

        try {
            const slaveData = new this.decodeEncodeModel({
                admin: decodeDto.adminId,
                slaveType: decodeDto.slaveType,
                uniqueId: shortid.generate(),
            });

            dirName = slaveData._id.toString();

            const admin = await this.adminService.findByIdAndSelect(decodeDto.adminId, [
                'email',
                'firstName',
                'lastName',
            ]);

            if (decodeDto.slaveType === SLAVE_TYPE.KESS3) {
                const kess3Data = await this.kess3Service.decodeFile({
                    adminId: decodeDto.adminId,
                    email: admin.email,
                    name: admin.firstName + ' ' + admin.lastName,
                    filePath: file.path,
                    documentId: slaveData._id as Types.ObjectId,
                    uniqueId: slaveData.uniqueId,
                });
                slaveData.kess3 = kess3Data;
                decodedFilePath = kess3Data.decodedFilePath;
                decodedFileName = kess3Data.decodedFileName;
            } else if (decodeDto.slaveType === SLAVE_TYPE.AUTO_TUNER) {
                const autoTunerData = await this.autoTunerService.decode({
                    adminId: decodeDto.adminId,
                    filePath: file.path,
                    documentId: slaveData._id as Types.ObjectId,
                });
                slaveData.autoTuner = autoTunerData;
                decodedFilePath = autoTunerData.decodedFilePath;
                decodedFileName = autoTunerData.decodedFileName;
            } else if (decodeDto.slaveType === SLAVE_TYPE.AUTO_FLASHER) {
                const autoFlasherData = await this.autoFlasherService.decode({
                    adminId: decodeDto.adminId,
                    filePath: file.path,
                    documentId: slaveData._id as Types.ObjectId,
                    uniqueId: slaveData.uniqueId,
                });
                slaveData.autoFlasher = autoFlasherData;
                decodedFilePath = autoFlasherData.decodedFilePath;
            } else if (decodeDto.slaveType === SLAVE_TYPE.FLEX_SLAVE) {
                const flexSlaveData = await this.flexSlaveService.decrypt({
                    adminId: decodeDto.adminId,
                    filePath: file.path,
                    documentId: slaveData._id as Types.ObjectId,
                    sn: decodeDto.sn,
                    uniqueId: slaveData.uniqueId,
                });
                slaveData.flexSlave = {
                    sn: decodeDto.sn,
                };
                decodedFilePath = flexSlaveData.decodedFilePath;
                decodedFileName = flexSlaveData.decodedFileName;
            }

            //upload files to s3
            const uploadPayload = [
                {
                    keyIdentifier: 'originalFile',
                    name: file.filename,
                    path: file.path,
                },
                {
                    keyIdentifier: 'decodedFile',
                    name: decodedFileName,
                    path: decodedFilePath,
                },
            ];

            const uploadFiles = await this.storageService.bulkUpload(slaveData._id.toString(), uploadPayload);

            for (const upload of uploadFiles) {
                if (upload.keyIdentifier === 'originalFile') {
                    slaveData.originalFile = {
                        key: upload.key,
                        originalname: file.originalname,
                        uniqueName: file.filename,
                    };
                } else if (upload.keyIdentifier === 'decodedFile') {
                    slaveData.decodedFile = {
                        key: upload.key,
                        originalname: decodedFileName,
                        uniqueName: decodedFileName,
                    };
                }
            }

            const data = await slaveData.save();

            return data;
        } catch (error) {
            if (originalKey) await this.storageService.delete(dirName, originalKey);
            if (decodedKey) await this.storageService.delete(dirName, decodedKey);
            console.log(error);
            throw error;
        } finally {
            if (existsSync(file.path)) unlinkSync(file.path);
            if (existsSync(decodedFilePath)) unlinkSync(decodedFilePath);
        }
    }

    async encodeMod(uniqueId: string, file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Please provide a file');
        }
        let uploadedKey = '';
        let dirName = '';

        try {
            const slaveData = await this.decodeEncodeModel.findOne({ uniqueId });
            if (!slaveData) {
                throw new NotFoundException('Mod File not found');
            }
            dirName = slaveData._id.toString();

            const encodedFile = await this.encodeModifiedFile(file.path, slaveData);

            //upload files to s3
            uploadedKey = await this.storageService.upload(slaveData._id.toString(), {
                name: basename(encodedFile),
                path: encodedFile,
            });

            slaveData.encodedFile = {
                key: uploadedKey,
                originalname: basename(encodedFile),
                uniqueName: basename(encodedFile),
            };

            await slaveData.save();
            return slaveData;
        } catch (error) {
            console.log(error);
            if (uploadedKey) await this.storageService.delete(dirName, uploadedKey);
            throw error;
        } finally {
            if (existsSync(file.path)) unlinkSync(file.path);
        }
    }

    private encodeModifiedFile(modifiedFilePath: string, decodeEncode: DecodeEncode) {
        if (decodeEncode.slaveType === SLAVE_TYPE.KESS3) {
            return this.kess3Service.encodeFile(
                {
                    uniqueId: decodeEncode.kess3.uniqueId,
                    documentId: decodeEncode._id as Types.ObjectId,
                    filePath: modifiedFilePath,
                    fileSlotGUID: decodeEncode.kess3.fileSlotGUID,
                    fileType: decodeEncode.kess3.fileType,
                    isCVNCorrectionPossible: decodeEncode.kess3.isCVNCorrectionPossible,
                    mode: decodeEncode.kess3.mode,
                },
                decodeEncode.admin,
            );
        } else if (decodeEncode.slaveType === SLAVE_TYPE.AUTO_TUNER) {
            return this.autoTunerService.encode({
                documentId: decodeEncode._id as Types.ObjectId,
                adminId: decodeEncode.admin,
                ecu_id: decodeEncode.autoTuner.ecu_id,
                filePath: modifiedFilePath,
                mcu_id: decodeEncode.autoTuner.mcu_id,
                model_id: decodeEncode.autoTuner.model_id,
                slave_id: decodeEncode.autoTuner.slave_id,
            });
        } else if (decodeEncode.slaveType === SLAVE_TYPE.AUTO_FLASHER) {
            return this.autoFlasherService.encode({
                documentId: decodeEncode._id as Types.ObjectId,
                adminId: decodeEncode.admin,
                filePath: modifiedFilePath,
                memory_type: decodeEncode.autoFlasher.memory_type,
                serialNumber: decodeEncode.autoFlasher.serialNumber,
            });
        } else if (decodeEncode.slaveType === SLAVE_TYPE.FLEX_SLAVE) {
            return this.flexSlaveService.encrypt({
                adminId: decodeEncode.admin,
                documentId: decodeEncode._id as Types.ObjectId,
                filePath: modifiedFilePath,
                sn: decodeEncode.flexSlave.sn,
            });
        }
    }
}
