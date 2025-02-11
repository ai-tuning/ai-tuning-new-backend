import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { collectionsName, SLAVE_TYPE } from '../constant';
import { FileService } from './schema/file-service.schema';
import { Connection, Model, Types } from 'mongoose';
import { AutomatisationDto } from './dto/create-file-service.dto';
import { CarService } from '../car/car.service';
import { CarControllerService } from '../car-controller/car-controller.service';
import { TempFileService } from './schema/temp-file.schema';
import { PathService } from '../common';
import { SolutionService } from '../solution/solution.service';
import { Solution } from '../solution/schema/solution.schema';
import { AutoTunerService } from '../auto-tuner/auto-tuner.service';
import { AutoFlasherService } from '../auto-flasher/auto-flasher.service';
import { Kess3Service } from '../kess3/kess3.service';
import { CustomerService } from '../customer/customer.service';
import * as pLimit from 'p-limit';

@Injectable()
export class FileServiceService {
  constructor(
    @InjectModel(collectionsName.fileService) private readonly fileServiceModel: Model<FileService>,
    @InjectModel(collectionsName.tempFileService) private readonly tempFileServiceModel: Model<TempFileService>,
    @InjectConnection() private readonly connection: Connection,
    private readonly customerService: CustomerService,
    private readonly carService: CarService,
    private readonly controllerService: CarControllerService,
    private readonly pathService: PathService,
    private readonly solutionService: SolutionService,
    private readonly autoTunerService: AutoTunerService,
    private readonly autoFlasherService: AutoFlasherService,
    private readonly kess3Service: Kess3Service,
  ) {}

  async findById(id: Types.ObjectId): Promise<FileService> {
    return this.fileServiceModel.findById(id).lean<FileService>();
  }

  async automatisation(automatisationDto: AutomatisationDto, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');

    let filePath = file.path;

    const car = await this.carService.findById(automatisationDto.car);
    if (!car) {
      throw new BadRequestException('Car not found');
    }
    const controller = await this.controllerService.findById(automatisationDto.controller);
    if (!controller) {
      throw new BadRequestException('Controller not found');
    }

    const customer = await this.customerService.findById(automatisationDto.customer);
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    const tempFileData = new this.tempFileServiceModel(automatisationDto);
    tempFileData.originalFile = path.basename(filePath);

    //resolve the slave file
    if (automatisationDto.slaveType === SLAVE_TYPE.KESS3) {
      const kess3 = await this.kess3Service.decodeFile({
        adminId: automatisationDto.admin,
        customerId: automatisationDto.customer.toString(),
        email: customer.email,
        name: customer.firstName + ' ' + customer.lastName,
        filePath,
      });
      tempFileData.kess3 = kess3;
      tempFileData.originalFile = filePath;
      tempFileData.decodedFile = kess3.decodedFileName;
      filePath = kess3.decodedFilePath;
    } else if (automatisationDto.slaveType === SLAVE_TYPE.AUTO_TUNER) {
      const autoTuner = await this.autoTunerService.decode({
        adminId: automatisationDto.admin,
        filePath,
      });
      tempFileData.autoTuner = autoTuner;
      tempFileData.decodedFile = autoTuner.decodedFilePath;
      filePath = autoTuner.decodedFilePath;
    } else if (automatisationDto.slaveType === SLAVE_TYPE.AUTO_FLASHER) {
      const autoFlasher = await this.autoFlasherService.decode({
        adminId: automatisationDto.admin,
        customerId: automatisationDto.customer,
        filePath,
      });
      tempFileData.autoFlasher = autoFlasher;
      tempFileData.decodedFile = autoFlasher.decodedFileName;
      filePath = autoFlasher.decodedFilePath;
    }

    const scriptPath = this.pathService.getCompleteScriptPath(car.admin, car.makeType, car.name, controller.name);
    if (!scriptPath) {
      return false;
    }

    const solutions = await this.solutionService.findByAdmin(car.admin);
    if (!solutions.length) {
      throw new BadRequestException("Your admin doesn't have solution");
    }

    const fileBufferContent = await fs.promises.readFile(filePath);

    const scriptFiles = await fs.promises.readdir(scriptPath);
    console.log('scriptFiles', scriptFiles);

    const limit = pLimit(10);
    //get the match script files
    const matchingScripts = await Promise.all(
      scriptFiles.map((scriptFile) =>
        limit(async () => {
          const scriptFilePath = path.join(scriptPath, scriptFile);
          const scriptContent = await fs.promises.readFile(scriptFilePath, 'utf-8');
          if (scriptFile.endsWith('.json') && this.isValidJSON(scriptContent)) {
            const isMatching = this.matchContent(fileBufferContent, scriptContent);
            return isMatching ? scriptFile : null;
          }
          return null;
        }),
      ),
    );

    console.log('matchingScripts', matchingScripts);
    //get the matching solution based on the matching script files name
    const matchedSolution = matchingScripts.reduce(
      (acc, scriptFile) => {
        if (scriptFile) {
          const solution = this.getMatchSolution(scriptFile, solutions);
          console.log('solution', solution);
          if (solution) {
            acc.push({ solution: { _id: solution._id as Types.ObjectId, name: solution.name }, fileName: scriptFile });
          }
        }
        return acc;
      },
      [] as { fileName: string; solution: { _id: Types.ObjectId; name: string } }[],
    );

    const newTempFileData = await tempFileData.save();

    return {
      matchedSolution,
      tempFileData: newTempFileData,
    };
  }

  matchContent(binFileBuffer: Buffer, scriptContent: string) {
    const { differences } = JSON.parse(scriptContent);
    return differences.every(
      ({ position, file1ByteHex }) =>
        position < binFileBuffer.length && binFileBuffer[position] === parseInt(file1ByteHex, 16),
    );
  }

  getMatchSolution(fileName: string, solutions: Solution[]): Solution | undefined {
    const lowerCaseFileName = fileName.toLowerCase();

    return solutions.find(({ name }) => {
      const lowerCaseName = name.toLowerCase().replace(/\s+/g, ''); // Remove spaces from the solution name

      const isStage1Match = lowerCaseName === 'stage1' && /stage ?1/.test(lowerCaseFileName);
      const isStage2Match = lowerCaseName === 'stage2' && /stage ?2/.test(lowerCaseFileName);
      const isGeneralMatch = lowerCaseFileName.includes(lowerCaseName);

      return isStage1Match || isStage2Match || isGeneralMatch;
    });
  }

  isValidJSON(jsonString: string) {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  }
}
