import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import {
  MAKE_TYPE_ENUM,
  collectionsName,
  SLAVE_TYPE,
  SOLUTION_CATEGORY,
  FILE_SERVICE_STATUS,
  PAYMENT_STATUS,
  EMAIL_TYPE,
  CHAT_BELONG,
  WinOLS_STATUS,
  CHAT_MESSAGE_SENDER_GROUP,
} from '../constant';
import { FileService } from './schema/file-service.schema';
import { ClientSession, Connection, Model, Types } from 'mongoose';
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
import { AdminService } from '../admin/admin.service';
import { Admin } from '../admin/schema/admin.schema';
import { ScriptService } from '../script/script.service';
import { FileProcessQueueProducers } from '../queue-manager/producers/file.queue.producer';
import { AdminPricingService } from '../admin-pricing/admin-pricing.service';
import { AdminPrices } from '../admin-pricing/schema/admin-pricing.schema';

const timeOutAsync = promisify(setTimeout);

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
    private readonly adminPricingService: AdminPricingService,
    private readonly storageService: StorageService,
    private readonly chatService: ChatService,
    private readonly adminService: AdminService,
    private readonly scriptService: ScriptService,
    private readonly emailQueueProducers: EmailQueueProducers,
    private readonly fileProcessProducer: FileProcessQueueProducers,
  ) {}

  async findById(id: Types.ObjectId): Promise<FileService> {
    return this.fileServiceModel.findById(id).lean<FileService>();
  }

  async findByCustomerId(customerId: Types.ObjectId): Promise<FileService[]> {
    return this.fileServiceModel.find({ customer: customerId }).sort({ createdAt: -1 }).lean<FileService[]>();
  }

  async findByAdminId(adminId: Types.ObjectId): Promise<FileService[]> {
    let query: any = { admin: new Types.ObjectId(adminId) };

    if (adminId.toString() === process.env.SUPER_ADMIN_ID) {
      query = { $or: [{ admin: new Types.ObjectId(adminId) }, { aiAssist: true }] };
    }

    return await this.fileServiceModel.aggregate([
      { $match: query }, // Filter by adminId or aiAssist

      // Assign a numeric weight to each status for custom sorting
      {
        $addFields: {
          statusPriority: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', FILE_SERVICE_STATUS.NEW] }, then: 1 },
                { case: { $eq: ['$status', FILE_SERVICE_STATUS.OPEN] }, then: 2 },
                { case: { $eq: ['$status', FILE_SERVICE_STATUS.IN_PROGRESS] }, then: 3 },
                { case: { $eq: ['$status', FILE_SERVICE_STATUS.COMPLETED] }, then: 4 },
                { case: { $eq: ['$status', FILE_SERVICE_STATUS.CLOSED] }, then: 5 },
              ],
              default: 6, // Default lowest priority for unknown status
            },
          },
        },
      },

      // Sorting: First by status priority, then by createdAt in descending order
      { $sort: { statusPriority: 1, createdAt: -1 } },

      // Populate required fields
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'cars',
          localField: 'car',
          foreignField: '_id',
          as: 'car',
        },
      },
      { $unwind: { path: '$car', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'controllers',
          localField: 'controller',
          foreignField: '_id',
          as: 'controller',
        },
      },
      { $unwind: { path: '$controller', preserveNullAndEmptyArrays: true } },

      // Final projection to remove unnecessary fields
      {
        $project: {
          statusPriority: 0, // Remove added sorting field from output
          customer: {
            admin: 0,
            email: 0,
            phone: 0,
            country: 0,
            city: 0,
            address: 0,
            postcode: 0,
            companyName: 0,
            countryCode: 0,
            credits: 0,
            status: 0,
            evcNumber: 0,
            user: 0,
            createdAt: 0,
            updatedAt: 0,
            vatNumber: 0,
            street: 0,
          },
          car: {
            admin: 0,
            makeType: 0,
            createdAt: 0,
            updatedAt: 0,
          },
          controller: {
            admin: 0,
            car: 0,
            createdAt: 0,
            updatedAt: 0,
          },
        },
      },
    ]);
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
    const controller = await this.controllerService.findByIdAndSelect(automatisationDto.controller, ['name']);
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

    //get complete script path
    let scriptPath = this.pathService.getCompleteScriptPath(
      automatisationDto.admin,
      car.makeType,
      car.name,
      controller.name,
    );

    const admin = await this.adminService.findByIdAndSelect(automatisationDto.admin, ['aiAssist']);
    if (admin.aiAssist || this.isSuperAdminId(automatisationDto.admin)) {
      //ai assist exist then forward it to ai assist
      scriptPath = this.pathService.getAiScriptPath(car.makeType, car.name, controller.name);
    }

    if (!fs.existsSync(scriptPath)) {
      fs.mkdirSync(scriptPath, { recursive: true });
    }

    const solutions = await this.solutionService.findAll();
    if (!solutions.length) {
      throw new BadRequestException("Your admin doesn't have solution");
    }
    const fileBufferContent = await fs.promises.readFile(filePath);

    const matchedSolution = await this.matchScriptAndSolution(fileBufferContent, scriptPath, solutions);

    const newTempFileData = await tempFileData.save();

    return {
      matchedSolution,
      tempFileData: newTempFileData,
    };
  }

  async updateWinolsStatus(fileServiceId: Types.ObjectId, winolsStatus: WinOLS_STATUS) {
    await this.fileServiceModel.updateOne({ _id: fileServiceId }, { $set: { winolsStatus } });
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

      const allAdminPricing = await this.adminPricingService.getAdminAllPricing();

      const adminData = await this.adminService.findByIdAndSelect(admin, ['category', 'credits', 'aiAssist']);

      let requiredAdminCredits = allAdminPricing.perFilePrice;

      if (adminData.aiAssist || this.isSuperAdminId(prepareSolutionDto.admin)) {
        const pricingWithCategory = allAdminPricing[tempFileService.makeType.toLowerCase()];
        const adminPricing = pricingWithCategory[adminData.category.toLowerCase()];
        requiredAdminCredits = this.calculateAdminCredits(selectedSolutionCategory, adminPricing);
      }

      console.log('requiredAdminCredits', requiredAdminCredits);

      if (requiredAdminCredits > adminData.credits) {
        throw new BadRequestException('Error 01 - Please contact Portal Owner');
      }

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

      //admin pricing data insert
      newFileService.adminCredits = requiredAdminCredits;
      newFileService.aiAssist = adminData.aiAssist;

      fileServicePath = this.pathService.getFileServicePath(admin, tempFileService._id as Types.ObjectId);

      //read the bin file
      let binFileBuffer: Buffer;
      if (!tempFileService.slaveType) {
        binFileBuffer = await fs.promises.readFile(path.join(fileServicePath, tempFileService.originalFile));
      } else {
        binFileBuffer = await fs.promises.readFile(path.join(fileServicePath, tempFileService.decodedFile));
      }

      //get the script path
      let scriptPath = this.pathService.getCompleteScriptPath(
        admin,
        tempFileService.makeType,
        car.name,
        controller.name,
      );

      //if ai assist is on then get the ai script
      if (adminData.aiAssist || this.isSuperAdminId(adminData._id)) {
        scriptPath = this.pathService.getAiScriptPath(tempFileService.makeType, car.name, controller.name);
      }

      for (const file of selectedFiles) {
        //get the file
        const fileItem = path.join(scriptPath, file);

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

          console.log('encodedPath', encodedPath);
          tempFileService.modFile = path.basename(encodedPath);
        }

        //update customer credit and admin credit if file is ready
        await this.customerService.updateCredit(customer._id as Types.ObjectId, -requiredCredits, session);

        newFileService.paymentStatus = PAYMENT_STATUS.PAID;
        newFileService.status = FILE_SERVICE_STATUS.COMPLETED;

        //reduce the admin credit
        await this.adminService.updateCredit(admin, -requiredAdminCredits, session);

        await tempFileService.save();
      } else {
        await tempFileService.save();
        const adminData = await this.adminService.findById(admin);

        //send the request to the queue for winols
        this.fileProcessProducer.processFile({ fileServiceData: newFileService, tempFileService, admin: adminData });
      }

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
            messageSenderGroup: CHAT_MESSAGE_SENDER_GROUP.CUSTOMER,
          },
          null,
          session,
        );
      }

      const result = await newFileService.save({ session });

      await session.commitTransaction();

      /**
       * Sending email for customer and admin
       */
      if (!requestedSolutions.length) {
        //Send email for file confirmation
        this.emailQueueProducers.sendMail({
          receiver: customer.email,
          name: customer.firstName + ' ' + customer.lastName,
          emailType: EMAIL_TYPE.fileReady,
          uniqueId: newFileService.uniqueId,
        });
      } else {
        //Send to customer
        this.emailQueueProducers.sendMail({
          receiver: customer.email,
          name: customer.firstName + ' ' + customer.lastName,
          emailType: EMAIL_TYPE.requestSolution,
          uniqueId: newFileService.uniqueId,
        });
        //send to admin
        this.emailQueueProducers.sendMail({
          receiver: adminData.email,
          name: customer.firstName + ' ' + customer.lastName,
          emailType: EMAIL_TYPE.newFileNotification,
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

  async matchScriptAndSolution(fileBufferContent: Buffer, scriptPath: string, solutions: Solution[]) {
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

    return matchedSolution;
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

  private calculateAdminCredits(services: SOLUTION_CATEGORY[], adminPricing: AdminPrices) {
    console.log('service', services, 'adminPricng', adminPricing);
    let totalCredits = 0;
    for (const service of services) {
      totalCredits += adminPricing[service.toLowerCase()];
    }
    return totalCredits;
  }

  /**
   * File process queue for winols
   */
  async fileProcess(fileServiceData: FileService, tempFileService: TempFileService, admin: Admin) {
    //change the file status to processing
    await this.fileServiceModel.updateOne(
      { _id: fileServiceData._id },
      { $set: { winolsStatus: WinOLS_STATUS.WinOLS_PROGRESS } },
    );

    //get the bin file path from temp file or download from the mega drive
    let binFilePath = '';

    //find temp file
    console.log('tempFileService===>', tempFileService);
    //check tempfile exist or not
    // if (tempFileService) {
    const fileServicePath = this.pathService.getFileServicePath(
      tempFileService.admin,
      tempFileService._id as Types.ObjectId,
    );
    console.log('fileServicePath->true===>', fileServicePath);

    //check service is slave or not
    if (!tempFileService.slaveType) {
      //if not slave then original file is the  bin file
      binFilePath = path.join(fileServicePath, tempFileService.originalFile);
      console.log('binFilePath->slave->false===>', binFilePath);
    } else {
      //if slave file then decoded file is the bin file
      binFilePath = path.join(fileServicePath, tempFileService.decodedFile);
      console.log('binFilePath->slave->true===>', binFilePath);
    }
    // } else {
    // //download file form mega
    // const tempFilePath = this.pathService.getTempFilePath(tempFileService.service.toString());
    // //define the exact content of the file
    // binFilePath = path.join(tempFilePath, fileServiceData.originalFile.uniqueName);
    // console.log('binFilePath else case', binFilePath);
    // //get bin file url
    // let binFileUrl = '';
    // if (!fileServiceData.slaveType) {
    //   binFileUrl = fileServiceData.originalFile.url;
    // } else {
    //   binFileUrl = fileServiceData.decodedFile.url;
    // }
    // console.log('start downloading file');
    // //download the binfile from mega drive
    // const fileContent = await this.storageService.downloadOnce(binFileUrl);
    // console.log('completed downloading file');
    // //write the file content
    // await fs.promises.writeFile(binFilePath, fileContent);
    // console.log('completed download file written');
    // }

    //copy to the winols destination folder
    const parsedName = path.parse(binFilePath);
    console.log('parsedName=======>', parsedName);

    //get winols input/output file path
    let inputPath = this.pathService.getWinolsInputPath(admin.username);
    let outputPath = this.pathService.getWinolsOutPath(admin.username, parsedName.name);

    if (admin.aiAssist || this.isSuperAdminId(admin._id)) {
      //get ai assist winols input/output file path

      inputPath = this.pathService.getAIWinolsInputPath();
      outputPath = this.pathService.getAIWinolsOutPath(parsedName.name);
    }

    console.log('ai assist==========>', admin.aiAssist);
    console.log('inputPath==========>', inputPath);
    console.log('outputPath============>', outputPath);

    //copy the binfile to the winols input folder
    await fs.promises.copyFile(binFilePath, path.join(inputPath, fileServiceData.originalFile.uniqueName));
    console.log('copped to the winols in folder done');

    console.log('waiting for 90 seconds');
    await timeOutAsync(90000);
    console.log('waited for 90 seconds');

    //define exist
    let outFileExits = fs.existsSync(outputPath);

    let attempts = 0;

    while (!outFileExits) {
      if (attempts > 5) {
        break;
      }
      //wait for 5 seconds
      console.log('waiting for 10 seconds');
      await timeOutAsync(10000);
      attempts += 1;
      outFileExits = fs.existsSync(outputPath);
      console.log('outFileExits==>', outFileExits, 'attempts==>', attempts);
    }

    if (!outFileExits) {
      throw new BadRequestException('Out File not found');
    }

    console.log('out file is exist');
    const outFiles = await fs.promises.readdir(outputPath);

    console.log('outFiles=====>', outFiles);

    let previousFileCount = outFiles.length;
    let currentFileCount = outFiles.length;
    attempts = 0;

    while (true) {
      if (attempts > 2) {
        break;
      }
      //wait for 5 seconds
      await timeOutAsync(5000);
      const outFiles = await fs.promises.readdir(outputPath);
      currentFileCount = outFiles.length;

      if (previousFileCount !== currentFileCount) {
        console.log('got new file');
        attempts = 0;
        previousFileCount = currentFileCount;
      } else {
        attempts += 1;
      }
    }

    return {
      binFilePath,
      outFiles,
      outputPath,
    };
  }

  /**
   * File process queue handler
   */

  async buildFileProcess(
    fileServiceData: FileService,
    tempFileService: TempFileService,
    admin: Admin,
    data: {
      binFilePath: string;
      outFiles: string[];
      outputPath: string;
    },
  ) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      console.log('Build process start');
      console.log(data);

      //get the requested and automatic solution
      const requested = fileServiceData.solutions.requested;
      const automatic = fileServiceData.solutions.automatic;

      console.log('solutions requested==>', requested);
      console.log('solutions automatic==>', automatic);

      await this.updateWinolsStatus(fileServiceData._id as Types.ObjectId, WinOLS_STATUS.BUILD_PROGRESS);

      //get solution without automatic solution, because these are already automatic
      const solutionWithoutAutomatic = await this.findSolutionWithoutAutomaticSolution(automatic);
      console.log('solutionWithoutAutomatic=====>', solutionWithoutAutomatic);
      //declare modFiles
      const modFiles = [];

      //loop over the outFiles and match with requested solution
      for (const solution of solutionWithoutAutomatic) {
        //get matched file
        const matchedFile = data.outFiles.find((file) => this.getMatchSolution(file, [solution]));
        if (matchedFile) {
          console.log('matchedFile', matchedFile);
          //if matched then push into mod file
          modFiles.push({
            name: matchedFile,
            path: path.join(data.outputPath, matchedFile),
          });
          console.log(
            'requested.indexOf(solution._id as Types.ObjectId)',
            requested.indexOf(solution._id as Types.ObjectId),
          );
          //remove from requested solution
          requested.splice(requested.indexOf(solution._id as Types.ObjectId), 1);

          automatic.push(solution._id as Types.ObjectId);
        }
      }

      console.log('new  requested==>', requested);
      console.log('new  automatic==>', automatic);

      console.log('mod file after matching===>', modFiles);

      //make scrips using the modFiles which is getting from the lua

      const originalFileContent = await fs.promises.readFile(data.binFilePath);

      //find car and controller
      const car = await this.carService.findByIdAndSelect(fileServiceData.car, ['name', 'makeType']);
      const controller = await this.controllerService.findByIdAndSelect(fileServiceData.controller, ['name']);

      let completeScriptPath = this.pathService.getCompleteScriptPath(
        admin._id as Types.ObjectId,
        car.makeType,
        car.name,
        controller.name,
      );

      //if ai assist enabled then get the script path of ai tuning
      if (admin.aiAssist || this.isSuperAdminId(admin._id)) {
        completeScriptPath = this.pathService.getAiScriptPath(car.makeType, car.name, controller.name);
      }

      for (const modFile of modFiles) {
        const modFileContent = await fs.promises.readFile(modFile.path);
        const differences = this.scriptService.compareFiles(originalFileContent, modFileContent);
        const hexDifferences = this.scriptService.convertDifferencesToHex(differences);

        const jsonDataItem = JSON.stringify({ differences: hexDifferences }, null, 2);

        const parsedName = path.parse(modFile.name);
        console.log('parsedName from build process modfile=======>', parsedName);

        const exactFilePath = path.join(completeScriptPath, parsedName.name + '-' + Date.now() + '.json');

        await fs.promises.writeFile(exactFilePath, jsonDataItem);
        console.log('new script written in ', exactFilePath);
      }

      if (!requested.length) {
        //check customer admin credits has enough credit or not

        if (admin.credits < fileServiceData.adminCredits) throw new BadRequestException('Not enough admin credits');

        const customer = await this.customerService.findById(fileServiceData.customer as Types.ObjectId);
        if (customer.credits < fileServiceData.credits) throw new BadRequestException('Not enough credits');

        const buildData = await this.buildSolution(
          fileServiceData,
          tempFileService,
          data.binFilePath,
          completeScriptPath,
          session,
        );
        //Send email for file confirmation
        this.emailQueueProducers.sendMail({
          receiver: customer.email,
          name: customer.firstName + ' ' + customer.lastName,
          emailType: EMAIL_TYPE.fileReady,
          uniqueId: fileServiceData.uniqueId,
        });

        delete buildData.fileService._id;
        delete buildData.tempFileService._id;

        buildData.fileService.winolsStatus = WinOLS_STATUS.WinOLS_OK;

        //update file service and temp file
        await this.fileServiceModel.updateOne(
          { _id: fileServiceData._id },
          { $set: buildData.fileService },
          { session },
        );

        await this.tempFileServiceModel.updateOne(
          { _id: tempFileService._id },
          { $set: buildData.tempFileService },
          { session },
        );

        //update file service and temp file
      } else {
        await this.updateWinolsStatus(fileServiceData._id as Types.ObjectId, WinOLS_STATUS.WinOLS_FAILED);
      }
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findSolutionWithoutAutomaticSolution(automatic: Types.ObjectId[]) {
    const solutions = await this.solutionService.findAll();

    return solutions.filter((solution) => !automatic.includes(solution._id as Types.ObjectId));
  }

  async buildSolution(
    fileService: FileService,
    tempFileService: TempFileService,
    binFilePath: string,
    scripPath: string,
    session: ClientSession,
  ) {
    const solutions = [];
    if (fileService.solutions.requested.length) {
      solutions.push(...fileService.solutions.requested);
    }
    if (fileService.solutions.automatic.length) {
      solutions.push(...fileService.solutions.automatic);
    }

    console.log('combined solutions from build functoin', solutions);
    console.log('Build start');

    //read bin file
    const fileBufferContent = await fs.promises.readFile(binFilePath);

    //get matched solution
    const matchedSolutions = await this.matchScriptAndSolution(fileBufferContent, scripPath, solutions);
    console.log('matchedSolution', matchedSolutions);

    for (const matchedSolution of matchedSolutions) {
      //get the script path

      //get the file
      const fileItem = path.join(scripPath, matchedSolution.fileName);
      console.log('file item======>', fileItem);

      //read the file and store the content
      const contents = JSON.parse(await fs.promises.readFile(fileItem, 'utf8'));

      //loop over the contents and write the content
      for (const content of contents.differences) {
        if (content.position < fileBufferContent.length) {
          fileBufferContent[content.position] = parseInt(content.file2ByteHex, 16);
        }
      }
    }

    const allSolutionName = [];
    for (const solution of matchedSolutions) {
      allSolutionName.push(solution.solution.name);
    }
    console.log('all solutoin name from build function', allSolutionName);

    const modifiedFileName = `MOD_${allSolutionName.join('_')}_${tempFileService.originalFileName.replace(/Original/i, 'modified')}`;

    console.log('modifiedFileName', modifiedFileName);

    const fileServicePath = this.pathService.getFileServicePath(
      tempFileService.admin,
      tempFileService._id as Types.ObjectId,
    );

    console.log('fileServicePath', fileServicePath);

    const modifiedPath = path.join(fileServicePath, modifiedFileName);

    console.log('modifiedPath from build function', modifiedPath);

    tempFileService.modWithoutEncoded = modifiedFileName;

    //write mod file
    await fs.promises.writeFile(modifiedPath, fileBufferContent);

    //handle encode if file is slave
    const encodedPath = await this.encodeModifiedFile(modifiedPath, tempFileService);

    console.log('encodedPath from build function', encodedPath);

    tempFileService.modFile = path.basename(encodedPath);

    //reduce customer credit
    await this.customerService.updateCredit(fileService.customer as Types.ObjectId, -fileService.credits, session);
    fileService.paymentStatus = PAYMENT_STATUS.PAID;
    fileService.status = FILE_SERVICE_STATUS.COMPLETED;

    //reduce admin credit
    await this.adminService.updateCredit(tempFileService.admin as Types.ObjectId, -fileService.credits, session);

    console.log('build upload start');
    if (modifiedPath) {
      const modWithoutEncodedFileSize = fs.statSync(modifiedPath).size;
      const modifiedUpload = await this.storageService.upload(fileService._id.toString(), {
        name: path.basename(modifiedPath),
        path: modifiedPath,
        size: modWithoutEncodedFileSize,
      });

      if (encodedPath) {
        fileService.modWithoutEncoded = {
          url: modifiedUpload,
          originalname: path.basename(modifiedPath),
          uniqueName: path.basename(modifiedPath),
        };
      } else {
        fileService.modFile = {
          url: modifiedUpload,
          originalname: path.basename(modifiedPath),
          uniqueName: path.basename(modifiedPath),
        };
      }
    }
    //encoded file
    if (encodedPath) {
      const encodedFileSize = fs.statSync(encodedPath).size;
      const encodedUpload = await this.storageService.upload(fileService._id.toString(), {
        name: path.basename(encodedPath),
        path: encodedPath,
        size: encodedFileSize,
      });
      fileService.modFile = {
        url: encodedUpload,
        originalname: path.basename(encodedPath),
        uniqueName: path.basename(encodedPath),
      };
    }
    console.log('build upload end');

    return { fileService, tempFileService };
  }

  async updateAiAssistant(fileServiceId: Types.ObjectId, aiAssist: boolean) {
    return await this.fileServiceModel.findByIdAndUpdate(fileServiceId, { $set: { aiAssist } }, { new: true });
  }

  async isSuperAdminId(adminId: Types.ObjectId) {
    return adminId.toString() === process.env.SUPER_ADMIN_ID.toString();
  }
}
