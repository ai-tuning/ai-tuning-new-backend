import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';
import {
  MAKE_TYPE_ENUM,
  collectionsName,
  SLAVE_TYPE,
  SOLUTION_CATEGORY,
  FILE_SERVICE_STATUS,
  PAYMENT_STATUS,
  EMAIL_TYPE,
  CHAT_BELONG,
} from '../constant';
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
import { PrepareSolutionDto } from './dto/prepare-solution.dto';
import { Pricing } from '../pricing/schema/pricing.schema';
import { PricingService } from '../pricing/pricing.service';
import { StorageService } from '../storage-service/storage-service.service';
import { EmailQueueProducers } from '../queue-manager/producers/email-queue.producers';
import { ChatService } from '../chat/chat.service';

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
    private readonly pricingService: PricingService,
    private readonly storageService: StorageService,
    private readonly chatService: ChatService,
    private readonly emailQueueProducers: EmailQueueProducers,
  ) {}

  async findById(id: Types.ObjectId): Promise<FileService> {
    return this.fileServiceModel.findById(id).lean<FileService>();
  }

  async findByCustomerId(customerId: Types.ObjectId): Promise<FileService[]> {
    return this.fileServiceModel.find({ customer: customerId }).lean<FileService[]>();
  }
  async findByAdminId(adminId: Types.ObjectId): Promise<FileService[]> {
    return await this.fileServiceModel
      .find({ admin: adminId })
      .populate({
        path: collectionsName.customer,
        select: 'firstName lastName customerType',
      })
      .populate({
        path: collectionsName.car,
        select: 'name logo',
      })
      .populate({
        path: collectionsName.controller,
        select: 'name',
      })
      .lean<FileService[]>();
  }

  async downloadFile(url: string) {
    return this.storageService.download(url);
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

    const fileServicePath = path.join(
      this.pathService.getFileServicePath(automatisationDto.admin, tempFileData._id as Types.ObjectId),
    );

    if (!fs.existsSync(fileServicePath)) {
      fs.mkdirSync(fileServicePath, { recursive: true });
    }

    const newFilePath = path.join(fileServicePath, file.filename);

    // move the file to file service path
    await fs.promises.rename(filePath, newFilePath);

    //set file path with new path
    filePath = newFilePath;

    tempFileData.originalFile = file.filename;
    tempFileData.originalFileName = file.originalname;
    tempFileData.makeType = car.makeType;

    //resolve the slave file
    if (automatisationDto.slaveType === SLAVE_TYPE.KESS3) {
      const kess3 = await this.kess3Service.decodeFile({
        adminId: automatisationDto.admin,
        tempFileId: tempFileData._id as Types.ObjectId,
        customerId: automatisationDto.customer.toString(),
        email: customer.email,
        name: customer.firstName + ' ' + customer.lastName,
        filePath,
      });
      tempFileData.kess3 = kess3;
      tempFileData.decodedFile = kess3.decodedFileName;
      filePath = kess3.decodedFilePath;
    } else if (automatisationDto.slaveType === SLAVE_TYPE.AUTO_TUNER) {
      const autoTuner = await this.autoTunerService.decode({
        adminId: automatisationDto.admin,
        tempFileId: tempFileData._id as Types.ObjectId,
        filePath,
      });
      tempFileData.autoTuner = autoTuner;
      tempFileData.decodedFile = autoTuner.decodedFileName;
      filePath = autoTuner.decodedFilePath;
    } else if (automatisationDto.slaveType === SLAVE_TYPE.AUTO_FLASHER) {
      const autoFlasher = await this.autoFlasherService.decode({
        adminId: automatisationDto.admin,
        customerId: automatisationDto.customer,
        tempFileId: tempFileData._id as Types.ObjectId,
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

  async prepareSolution(prepareSolutionDto: PrepareSolutionDto) {
    const session = await this.connection.startSession();
    let fileServicePath: string;
    try {
      session.startTransaction();
      //destructuring the body
      const {
        requestedSolutions,
        tempFileService: tempFileServiceId,
        selectedSolutions,
        selectedFiles,
        selectedSolutionCategory,
        admin,
        ...rest
      } = prepareSolutionDto;

      //get the temp file service
      const tempFileService = await this.tempFileServiceModel.findById(tempFileServiceId);

      if (!tempFileService) {
        throw new BadRequestException('Something went wrong');
      }

      const customer = await this.customerService.findById(tempFileService.customer);

      if (!customer) {
        throw new BadRequestException('Customer not found');
      }

      const car = await this.carService.findById(tempFileService.car);

      if (!car) {
        throw new BadRequestException('Car not found');
      }

      const controller = await this.controllerService.findById(tempFileService.controller);

      if (!controller) {
        throw new BadRequestException('Controller not found');
      }

      const allSolution = selectedSolutions.concat(requestedSolutions);

      if (!allSolution.length) {
        throw new BadRequestException('No solution selected');
      }

      const allSolutionName = await this.solutionService.findByIdsAndDistinctName(allSolution);

      const pricing = await this.pricingService.getPricingByCustomerType(admin, customer.customerType);

      const requiredCredits = this.calculateCredits(selectedSolutionCategory, pricing, tempFileService.makeType);

      if (requiredCredits > customer.credits) {
        throw new BadRequestException("You don't have enough credits");
      }

      const newFileService = new this.fileServiceModel(rest);
      newFileService.carModel = rest.carModel;
      newFileService.customer = customer._id as Types.ObjectId;
      newFileService.admin = admin as Types.ObjectId;
      newFileService.car = car._id as Types.ObjectId;
      newFileService.controller = controller._id as Types.ObjectId;
      newFileService.status = FILE_SERVICE_STATUS.NEW;
      newFileService.credits = requiredCredits;
      newFileService.paymentStatus = PAYMENT_STATUS.UNPAID;
      newFileService.solutions = {
        automatic: selectedSolutions,
        requested: requestedSolutions,
      };
      newFileService.uniqueId = Date.now().toString();

      fileServicePath = this.pathService.getFileServicePath(admin, tempFileService._id as Types.ObjectId);

      //read the bin file
      let binFileBuffer: Buffer;
      if (!tempFileService.slaveType) {
        binFileBuffer = await fs.promises.readFile(path.join(fileServicePath, tempFileService.originalFile));
      } else {
        binFileBuffer = await fs.promises.readFile(path.join(fileServicePath, tempFileService.decodedFile));
      }

      for (const file of selectedFiles) {
        //get the script path
        const solutionPath = this.pathService.getCompleteScriptPath(
          admin,
          tempFileService.makeType,
          car.name,
          controller.name,
        );

        //get the file
        const fileItem = path.join(solutionPath, file);

        //read the file and store the content
        const contents = JSON.parse(await fs.promises.readFile(fileItem, 'utf8'));

        for (const content of contents.differences) {
          if (content.position < binFileBuffer.length) {
            binFileBuffer[content.position] = parseInt(content.file2ByteHex, 16);
          }
        }
      }

      //handle ini files for WINOLS
      const iniData = `[WinOLS]
VehicleType=${tempFileService.makeType}
VehicleProducer=${car.name}
VehicleSeries=${rest.carModel}
VehicleModel=${rest.engine}
EcuProducer=${controller.name}
EcuBuild=${rest.exactEcu}
VehicleModelYear=${rest.year}
OutputPS=${rest.power.toString().replace(/\ps/gi, '')} //remove "PS" or "ps" with empty value
EngineProducer=${car.name}
EngineType=${rest.fuel}
EngineTransmission=${rest.gearbox}
ReadingHardware=${rest.readingTool}
ResellerCredits= 10
`;

      const iniFileName = `${tempFileService.originalFileName}.ini`;

      //save the ini file to tempDB
      tempFileService.iniFile = iniFileName;

      await fs.promises.writeFile(path.join(fileServicePath, iniFileName), iniData);

      let encodedPath: string;
      let modifiedPath: string;
      if (!requestedSolutions.length) {
        const modifiedFileName = `MOD_${allSolutionName.join('_')}_${tempFileService.originalFileName.replace(/Original/i, 'modified')}`;

        modifiedPath = path.join(fileServicePath, modifiedFileName);

        tempFileService.modWithoutEncoded = modifiedFileName;

        await fs.promises.writeFile(modifiedPath, binFileBuffer);

        //handle encode if file is slave
        if (tempFileService.slaveType) {
          newFileService.slaveType = tempFileService.slaveType;
          if (tempFileService.slaveType === SLAVE_TYPE.AUTO_TUNER) {
            newFileService.autoTuner = tempFileService.autoTuner;
          } else if (tempFileService.slaveType === SLAVE_TYPE.AUTO_FLASHER) {
            newFileService.autoFlasher = tempFileService.autoFlasher;
          } else if (tempFileService.slaveType === SLAVE_TYPE.KESS3) {
            newFileService.kess3 = tempFileService.kess3;
          }
          encodedPath = await this.encodeModifiedFile(modifiedPath, tempFileService);
          tempFileService.modFile = path.basename(encodedPath);
        }
        await this.customerService.updateCredit(customer._id as Types.ObjectId, -requiredCredits, session);
        newFileService.paymentStatus = PAYMENT_STATUS.PAID;
        newFileService.status = FILE_SERVICE_STATUS.COMPLETED;
      } else {
        //mail to both admin and the customer
        //send the request to the queue for winols
      }

      //==========upload to the cloud===================
      await tempFileService.save();

      //original file
      const originalFilePath = path.join(fileServicePath, tempFileService.originalFile);
      const originalFileSize = fs.statSync(originalFilePath).size;
      const originalUpload = await this.storageService.upload(newFileService._id.toString(), {
        name: tempFileService.originalFile,
        path: originalFilePath,
        size: originalFileSize,
      });
      newFileService.originalFile = {
        url: originalUpload,
        originalname: tempFileService.originalFileName,
        uniqueName: tempFileService.originalFile,
      };

      //upload ini file
      const iniFilePath = path.join(fileServicePath, tempFileService.iniFile);
      const iniFileSize = fs.statSync(iniFilePath).size;
      const iniUpload = await this.storageService.upload(newFileService._id.toString(), {
        name: tempFileService.iniFile,
        path: iniFilePath,
        size: iniFileSize,
      });
      newFileService.iniFile = {
        url: iniUpload,
        originalname: tempFileService.iniFile,
        uniqueName: tempFileService.iniFile,
      };

      if (tempFileService.decodedFile) {
        //decoded file
        const decodedFilePath = path.join(fileServicePath, tempFileService.decodedFile);
        const decodedFileSize = fs.statSync(decodedFilePath).size;
        const decodedUpload = await this.storageService.upload(newFileService._id.toString(), {
          name: tempFileService.decodedFile,
          path: decodedFilePath,
          size: decodedFileSize,
        });
        newFileService.decodedFile = {
          url: decodedUpload,
          originalname: tempFileService.decodedFile,
          uniqueName: tempFileService.decodedFile,
        };
      }

      if (modifiedPath) {
        const modWithoutEncodedFileSize = fs.statSync(modifiedPath).size;
        const modifiedUpload = await this.storageService.upload(newFileService._id.toString(), {
          name: path.basename(modifiedPath),
          path: modifiedPath,
          size: modWithoutEncodedFileSize,
        });

        if (encodedPath) {
          newFileService.modWithoutEncoded = {
            url: modifiedUpload,
            originalname: path.basename(modifiedPath),
            uniqueName: path.basename(modifiedPath),
          };
        } else {
          newFileService.modFile = {
            url: modifiedUpload,
            originalname: path.basename(modifiedPath),
            uniqueName: path.basename(modifiedPath),
          };
        }
      }

      //encoded file
      if (encodedPath) {
        const encodedFileSize = fs.statSync(encodedPath).size;
        const encodedUpload = await this.storageService.upload(newFileService._id.toString(), {
          name: path.basename(encodedPath),
          path: encodedPath,
          size: encodedFileSize,
        });
        newFileService.modFile = {
          url: encodedUpload,
          originalname: path.basename(encodedPath),
          uniqueName: path.basename(encodedPath),
        };
      }

      if (prepareSolutionDto.comments) {
        //send the comment in the chat
        await this.chatService.create(
          {
            admin: admin as Types.ObjectId,
            chatBelong: CHAT_BELONG.FILE_SERVICE,
            customer: customer._id as Types.ObjectId,
            message: prepareSolutionDto.comments,
            receiver: admin as Types.ObjectId,
            service: newFileService._id as Types.ObjectId,
            sender: customer.user as Types.ObjectId,
          },
          null,
          session,
        );
      }

      const result = await newFileService.save({ session });

      await session.commitTransaction();

      if (!requestedSolutions.length) {
        //Send email for file confirmation
        this.emailQueueProducers.sendMail({
          receiver: customer.email,
          name: customer.firstName + ' ' + customer.lastName,
          emailType: EMAIL_TYPE.fileReady,
          uniqueId: newFileService.uniqueId,
        });
      }

      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private encodeModifiedFile(modifiedFilePath: string, tempFileService: TempFileService) {
    if (tempFileService.slaveType === SLAVE_TYPE.KESS3) {
      return this.kess3Service.encodeFile(
        {
          customerId: tempFileService.customer.toString(),
          tempFileId: tempFileService._id as Types.ObjectId,
          filePath: modifiedFilePath,
          fileSlotGUID: tempFileService.kess3.fileSlotGUID,
          fileType: tempFileService.kess3.fileType,
          isCVNCorrectionPossible: tempFileService.kess3.isCVNCorrectionPossible,
          mode: tempFileService.kess3.mode,
        },
        tempFileService.admin,
      );
    } else if (tempFileService.slaveType === SLAVE_TYPE.AUTO_TUNER) {
      return this.autoTunerService.encode({
        tempFileId: tempFileService._id as Types.ObjectId,
        adminId: tempFileService.admin,
        ecu_id: tempFileService.autoTuner.ecu_id,
        filePath: modifiedFilePath,
        mcu_id: tempFileService.autoTuner.mcu_id,
        model_id: tempFileService.autoTuner.model_id,
        slave_id: tempFileService.autoTuner.slave_id,
      });
    } else if (tempFileService.slaveType === SLAVE_TYPE.AUTO_FLASHER) {
      return this.autoFlasherService.encode({
        tempFileId: tempFileService._id as Types.ObjectId,
        adminId: tempFileService.admin,
        filePath: modifiedFilePath,
        memory_type: tempFileService.autoFlasher.memory_type,
        serialNumber: tempFileService.autoFlasher.serialNumber,
      });
    }
  }

  private matchContent(binFileBuffer: Buffer, scriptContent: string) {
    const { differences } = JSON.parse(scriptContent);
    return differences.every(
      ({ position, file1ByteHex }) =>
        position < binFileBuffer.length && binFileBuffer[position] === parseInt(file1ByteHex, 16),
    );
  }

  private getMatchSolution(fileName: string, solutions: Solution[]): Solution | undefined {
    const lowerCaseFileName = fileName.toLowerCase();

    return solutions.find(({ name }) => {
      const lowerCaseName = name.toLowerCase().replace(/\s+/g, ''); // Remove spaces from the solution name

      const isStage1Match = lowerCaseName === 'stage1' && /stage ?1/.test(lowerCaseFileName);
      const isStage2Match = lowerCaseName === 'stage2' && /stage ?2/.test(lowerCaseFileName);
      const isGeneralMatch = lowerCaseFileName.includes(lowerCaseName);

      return isStage1Match || isStage2Match || isGeneralMatch;
    });
  }

  private isValidJSON(jsonString: string) {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  }

  private calculateCredits(services: SOLUTION_CATEGORY[], pricing: Pricing, makeType: MAKE_TYPE_ENUM) {
    let totalCredits = 0;
    //handle car
    if (makeType) {
      const pricingItems = pricing.items.filter((item) => item.makeType === makeType);
      for (const service of services) {
        const item = pricingItems.find((item) => item.solutionCategory === service);
        if (item) {
          totalCredits += item.price;
        }
      }
    }
    return totalCredits;
  }
}
