import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateScriptDto } from './dto/create-script.dto';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { Script } from './schema/script.schema';
import { Model, Types } from 'mongoose';
import { PathService } from '../common';
import { StorageService } from '../storage-service/storage-service.service';
import { CarControllerService } from '../car-controller/car-controller.service';
import { CarService } from '../car/car.service';
import { ReplaceScriptDto } from './dto/replace-script.dto';
import { FileService } from '../file-service/schema/file-service.schema';
import { FileModel } from '../common/schema/file.schema';

@Injectable()
export class ScriptService {
    constructor(
        @InjectModel(collectionsName.script) private readonly scriptModel: Model<Script>,
        @InjectModel(collectionsName.fileService) private readonly fileServiceModel: Model<FileService>,
        private readonly storageService: StorageService,
        private readonly carService: CarService,
        private readonly controllerService: CarControllerService,
        private readonly pathService: PathService,
    ) {}
    async create(
        createScriptDto: CreateScriptDto,
        originalFile: Express.Multer.File | FileModel,
        modFiles: Express.Multer.File[],
    ) {
        let binFilePath: string;
        let modFilesPath: string[] = [];

        try {
            const car = await this.carService.findByIdAndSelect(createScriptDto.car, ['name', 'makeType']);
            if (!car) throw new NotFoundException('Car not found');
            const controller = await this.controllerService.findByIdAndSelect(createScriptDto.controller, [
                'car',
                'name',
            ]);
            if (!controller) throw new NotFoundException('Controller not found');

            //manage files
            if (createScriptDto.fileService) {
                const fileService = await this.fileServiceModel.findById(createScriptDto.fileService);
                if (!fileService) {
                    throw new NotFoundException('File service not found');
                }
                // fileService.originalFile = originalFile as FileSchema;
                const fileServicePath = this.pathService.getFileServicePath(
                    fileService.admin,
                    fileService._id as Types.ObjectId,
                );

                let key = '';

                if (!fs.existsSync(fileServicePath)) {
                    await fs.promises.mkdir(fileServicePath);
                }

                //download the original file
                if (fileService.slaveType) {
                    binFilePath = path.join(fileServicePath, fileService.decodedFile.uniqueName);

                    key = fileService.decodedFile.key;
                } else {
                    // binFilePath = this.pathService.getTempFilePath(fileService.originalFile.uniqueName);
                    binFilePath = path.join(fileServicePath, fileService.originalFile.uniqueName);
                    key = fileService.originalFile.key;
                }

                if (!fs.existsSync(binFilePath)) {
                    const fileData = await this.storageService.download(key);
                    await fs.promises.writeFile(binFilePath, fileData);
                }
            } else {
                if (!originalFile) throw new BadRequestException('Original file is required');
                const oriFile = originalFile as Express.Multer.File;
                binFilePath = oriFile.path;
            }

            if (!fs.existsSync(binFilePath)) {
                throw new BadRequestException('Original file not found');
            }

            //check if the file size is different
            if (this.compareFileSize(binFilePath, modFiles)) {
                throw new BadRequestException('Mod files must be same size as original file');
            }

            let completeScriptPath = this.pathService.getCompleteScriptPath(
                createScriptDto.admin,
                car.makeType,
                car.name,
                controller.name,
            );

            if (createScriptDto.admin.toString() === process.env.SUPER_ADMIN_ID) {
                completeScriptPath = this.pathService.getAiScriptPath(car.makeType, car.name, controller.name);
            }

            if (!fs.existsSync(completeScriptPath)) {
                fs.mkdirSync(completeScriptPath, { recursive: true });
            }

            const originalFileContent = await fs.promises.readFile(binFilePath);

            const scriptPayload = []; //for storing script for db

            for (const modFile of modFiles) {
                const modFileContent = await fs.promises.readFile(modFile.path);
                const differences = this.compareFiles(originalFileContent, modFileContent);
                const hexDifferences = this.convertDifferencesToHex(differences);
                const resultData = {
                    differences: hexDifferences,
                };

                const jsonDataItem = JSON.stringify(resultData, null, 2);
                const parsedName = path.parse(modFile.filename);

                const exactFilePath = path.join(completeScriptPath, parsedName.name + '.json');

                const parseOriginalName = path.parse(modFile.originalname);

                scriptPayload.push({
                    admin: createScriptDto.admin,
                    makeType: car.makeType,
                    car: createScriptDto.car,
                    controller: createScriptDto.controller,
                    file: `${parsedName.name}.json`,
                    originalName: `${parseOriginalName.name}.json`,
                });
                await fs.promises.writeFile(exactFilePath, jsonDataItem);

                modFilesPath.push(modFile.path);
            }

            const scripts = await this.scriptModel.create(scriptPayload);
            return scripts;
        } catch (error) {
            throw error;
        } finally {
            for (const modFilePath of modFilesPath) {
                if (fs.existsSync(modFilePath)) {
                    fs.rmSync(modFilePath, { recursive: true, force: true });
                }
            }
            if (binFilePath && fs.existsSync(binFilePath)) {
                fs.rmSync(binFilePath, { recursive: true, force: true });
            }
        }
    }

    async findByAdmin(adminId: Types.ObjectId) {
        return this.scriptModel
            .find({ admin: adminId })
            .populate({
                path: 'car',
                select: 'name',
            })
            .populate({
                path: 'controller',
                select: 'name',
            })
            .sort({ createdAt: -1 })
            .lean<Script[]>();
    }

    compareFileSize(originalFilePath: string, modFiles: Express.Multer.File[]) {
        let hasDifferentSize = false;
        const originalFileSize = fs.statSync(originalFilePath).size;

        for (const modFile of modFiles) {
            const modFileSize = fs.statSync(modFile.path).size;
            if (modFileSize !== originalFileSize) {
                hasDifferentSize = true;
                break;
            }
        }

        return hasDifferentSize;
    }

    convertDifferencesToHex(differences: { position: number; file1Byte: number; file2Byte: number }[]) {
        return differences.map((diff) => {
            const file1ByteHex = diff.file1Byte !== undefined ? diff.file1Byte.toString(16).padStart(2, '0') : '??';
            const file2ByteHex = diff.file2Byte !== undefined ? diff.file2Byte.toString(16).padStart(2, '0') : '??';
            return {
                position: diff.position,
                file1ByteHex,
                file2ByteHex,
            };
        });
    }

    compareFiles(file1Buffer: Buffer, file2Buffer: Buffer) {
        const maxLength = Math.max(file1Buffer.length, file2Buffer.length);
        const differences = [];

        for (let i = 0; i < maxLength; i++) {
            if (file1Buffer[i] !== file2Buffer[i]) {
                differences.push({
                    position: i,
                    file1Byte: file1Buffer[i],
                    file2Byte: file2Buffer[i],
                });
            }
        }

        return differences;
    }

    async downloadScript(scriptId: Types.ObjectId) {
        const script = await this.scriptModel
            .findById(scriptId)
            .populate({
                path: 'car',
                select: 'name',
            })
            .populate({
                path: 'controller',
                select: 'name',
            })
            .lean<any>();

        if (!script) {
            throw new NotFoundException('Script not found');
        }

        let scriptBasePath = this.pathService.getCompleteScriptPath(
            script.admin,
            script.makeType,
            script.car.name,
            script.controller.name,
        );
        if (script.admin.toString() === process.env.SUPER_ADMIN_ID) {
            scriptBasePath = this.pathService.getAiScriptPath(script.makeType, script.car.name, script.controller.name);
        }

        const filePath = path.join(scriptBasePath, script.file);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('File not found');
        }

        return filePath;
    }

    async deleteScript(scriptId: Types.ObjectId) {
        const deletedScript = await this.scriptModel
            .findByIdAndDelete(scriptId)
            .populate({
                path: 'car',
                select: 'name',
            })
            .populate({
                path: 'controller',
                select: 'name',
            })
            .lean<any>();

        if (!deletedScript) {
            throw new NotFoundException('Script not found');
        }

        const scriptBasePath = this.pathService.getCompleteScriptPath(
            deletedScript.admin,
            deletedScript.makeType,
            deletedScript.car.name,
            deletedScript.controller.name,
        );

        const filePath = path.join(scriptBasePath, deletedScript.file);

        if (fs.existsSync(filePath)) {
            fs.rmSync(filePath, { recursive: true, force: true });
        }

        return deletedScript;
    }

    async replaceScript(replaceScriptDto: ReplaceScriptDto, modFile: Express.Multer.File) {
        let binFilePath = '';
        try {
            if (!modFile) {
                throw new BadRequestException('File Not found');
            }
            const fileService = await this.fileServiceModel.findById(replaceScriptDto.fileService);
            if (!fileService) {
                throw new BadRequestException('File Service Not found');
            }

            const car = await this.carService.findById(fileService.car);
            const controller = await this.controllerService.findById(fileService.controller);

            let scriptPath = this.pathService.getCompleteScriptPath(
                fileService.admin,
                car.makeType,
                car.name,
                controller.name,
            );

            if (fileService.admin.toString() === process.env.SUPER_ADMIN_ID) {
                scriptPath = this.pathService.getAiScriptPath(car.makeType, car.name, controller.name);
            }

            const files = await fs.promises.readdir(scriptPath);

            if (!files.length) {
                throw new BadRequestException('Script Directory is empty');
            }

            const matchFile = files.find((file) => {
                const lowercaseFilename = file.toLowerCase().replace(/\s+/g, ''); // Remove spaces from the solution name
                return lowercaseFilename.includes(replaceScriptDto.scriptToReplace.toLowerCase().replace(/\s+/g, '')); // Remove spaces from the solution name
            });

            if (!matchFile) {
                throw new BadRequestException('Script not found');
            }

            // fileService.originalFile = originalFile as FileSchema;
            const fileServicePath = this.pathService.getFileServicePath(
                fileService.admin,
                fileService._id as Types.ObjectId,
            );

            let key = '';

            if (!fs.existsSync(fileServicePath)) {
                await fs.promises.mkdir(fileServicePath);
            }

            //download the original file
            if (fileService.slaveType) {
                binFilePath = path.join(fileServicePath, fileService.decodedFile.uniqueName);

                key = fileService.decodedFile.key;
            } else {
                // binFilePath = this.pathService.getTempFilePath(fileService.originalFile.uniqueName);
                binFilePath = path.join(fileServicePath, fileService.originalFile.uniqueName);
                key = fileService.originalFile.key;
            }

            if (!fs.existsSync(binFilePath)) {
                const fileData = await this.storageService.download(key);
                await fs.promises.writeFile(binFilePath, fileData);
                console.log('file downloaded', replaceScriptDto.fileService);
            } else {
                console.log('file downloaded not needed', replaceScriptDto.fileService);
            }

            if (!fs.existsSync(binFilePath)) {
                throw new BadRequestException('Original File not found');
            }

            const originalFileDetails = await fs.promises.stat(binFilePath);

            const modFileDetails = await fs.promises.stat(modFile.path);

            if (originalFileDetails.size !== modFileDetails.size) {
                throw new BadRequestException('Mod files must be same size as original file');
            }

            const originalContent = await fs.promises.readFile(binFilePath);
            const modContent = await fs.promises.readFile(modFile.path);
            const differences = this.compareFiles(originalContent, modContent);
            const hexDifferences = this.convertDifferencesToHex(differences);

            const jsonDataItem = JSON.stringify(
                {
                    differences: hexDifferences,
                },
                null,
                2,
            );

            await fs.promises.writeFile(path.join(scriptPath, matchFile), jsonDataItem);
            return true;
        } catch (error) {
            throw error;
        } finally {
            if (fs.existsSync(modFile.path)) {
                fs.rmSync(modFile.path, { recursive: true, force: true });
            }
        }
    }
}
