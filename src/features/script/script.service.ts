import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateScriptDto } from './dto/create-script.dto';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName } from '../constant';
import { Script } from './schema/script.schema';
import { Model, Types } from 'mongoose';
import { FileServiceService } from '../file-service/file-service.service';
import { FileSchema, PathService } from '../common';
import { StorageService } from '../storage-service/storage-service.service';
import { CarControllerService } from '../car-controller/car-controller.service';
import { CarService } from '../car/car.service';
import { ReplaceScriptDto } from './dto/replace-script.dto';

@Injectable()
export class ScriptService {
  constructor(
    @InjectModel(collectionsName.script) private readonly scriptModel: Model<Script>,
    private readonly fileServiceService: FileServiceService,
    private readonly storageService: StorageService,
    private readonly carService: CarService,
    private readonly controllerService: CarControllerService,
    private readonly pathService: PathService,
  ) {}
  async create(
    createScriptDto: CreateScriptDto,
    originalFile: Express.Multer.File | FileSchema,
    modFiles: Express.Multer.File[],
  ) {
    let originalFilePath: string;
    let modFilesPath: string[] = [];

    try {
      const car = await this.carService.findById(createScriptDto.car);
      if (!car) throw new NotFoundException('Car not found');
      const controller = await this.controllerService.findById(createScriptDto.controller);
      if (!controller) throw new NotFoundException('Controller not found');

      //manage files
      if (createScriptDto.fileService) {
        const fileService = await this.fileServiceService.findById(createScriptDto.fileService);
        if (!fileService) {
          throw new NotFoundException('File service not found');
        }
        // fileService.originalFile = originalFile as FileSchema;

        //download the original file
        if (fileService.slaveType) {
          originalFilePath = this.pathService.getTempFilePath(fileService.decodedFile.uniqueName);
          console.log(originalFilePath);
        } else {
          originalFilePath = this.pathService.getTempFilePath(fileService.originalFile.uniqueName);
          console.log(originalFilePath);
        }

        const fileData = await this.storageService.downloadOnce(fileService.originalFile.url);
        await fs.promises.writeFile(originalFilePath, fileData);
      } else {
        if (!originalFile) throw new BadRequestException('Original file is required');
        const oriFile = originalFile as Express.Multer.File;
        originalFilePath = oriFile.path;
      }

      if (!fs.existsSync(originalFilePath)) {
        throw new BadRequestException('Original file not found');
      }

      //check if the file size is different
      if (this.compareFileSize(originalFilePath, modFiles)) {
        throw new BadRequestException('Mod files must be same size as original file');
      }

      const completeScriptPath = this.pathService.getCompleteScriptPath(
        createScriptDto.admin,
        car.makeType,
        car.name,
        controller.name,
      );
      if (!fs.existsSync(completeScriptPath)) {
        fs.mkdirSync(completeScriptPath, { recursive: true });
      }

      const originalFileContent = await fs.promises.readFile(originalFilePath);

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
        console.log(modFilePath);
        if (fs.existsSync(modFilePath)) {
          fs.rmSync(modFilePath, { recursive: true, force: true });
        }
      }
      if (originalFilePath && fs.existsSync(originalFilePath)) {
        fs.rmSync(originalFilePath, { recursive: true, force: true });
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
      .lean<Script[]>();
  }

  private compareFileSize(originalFilePath: string, modFiles: Express.Multer.File[]) {
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

  private convertDifferencesToHex(differences: { position: number; file1Byte: number; file2Byte: number }[]) {
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

  private compareFiles(file1Buffer: Buffer, file2Buffer: Buffer) {
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

    const scriptBasePath = this.pathService.getCompleteScriptPath(
      script.admin,
      script.makeType,
      script.car.name,
      script.controller.name,
    );

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
    let filePath = '';
    try {
      if (!modFile) {
        throw new BadRequestException('File Not found');
      }
      const fileService = await this.fileServiceService.findById(replaceScriptDto.fileService);
      if (!fileService) {
        throw new BadRequestException('File Service Not found');
      }

      const car = await this.carService.findById(fileService.car);
      const controller = await this.controllerService.findById(fileService.controller);

      const scriptPath = this.pathService.getCompleteScriptPath(
        fileService.admin,
        car.makeType,
        car.name,
        controller.name,
      );
      const files = await fs.promises.readdir(scriptPath);

      if (!files.length) {
        throw new BadRequestException('Script Directory is empty');
      }

      const matchFile = files.find((file) => {
        const lowercaseFilename = file.toLowerCase().replace(/\s+/g, ''); // Remove spaces from the solution name
        lowercaseFilename.includes(replaceScriptDto.scriptToReplace.toLowerCase().replace(/\s+/g, '')); // Remove spaces from the solution name
      });

      if (!matchFile) {
        throw new BadRequestException('Script not found');
      }

      //download the file from mega
      if (fileService.slaveType) {
        filePath = this.pathService.getTempFilePath(fileService.decodedFile.uniqueName);
      } else {
        filePath = this.pathService.getTempFilePath(fileService.originalFile.uniqueName);
      }
      //download the original file
      const fileData = await this.storageService.downloadOnce(fileService.originalFile.url);
      await fs.promises.writeFile(filePath, fileData);

      if (!fs.existsSync(filePath)) {
        throw new BadRequestException('Original File not found');
      }

      if (!fileService.slaveType) {
        const originalFileDetails = await fs.promises.stat(filePath);

        const modFileDetails = await fs.promises.stat(modFile.path);

        if (originalFileDetails.size !== modFileDetails.size) {
          throw new BadRequestException('Mod files must be same size as original file');
        }
      }

      const originalContent = await fs.promises.readFile(filePath);
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
      console.log('Deleting files');
      if (fs.existsSync(modFile.path)) {
        fs.rmSync(modFile.path, { recursive: true, force: true });
      }
      if (filePath && fs.existsSync(filePath)) {
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    }
  }
}
