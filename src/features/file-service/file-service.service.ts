import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as shortid from 'shortid';
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
import { IAuthUser, PathService } from '../common';
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
import { PRICING_TYPE_ENUM } from '../constant/enums/pricing-type.enum';
import { CatapushMessageProducer } from '../queue-manager/producers/catapush-message.producer';
import { SolutionInformation } from '../solution/schema/solution-information.schema';
import { SolutionInformationService } from '../solution/solution-information.service';
import { FlexSlaveService } from '../flex-slave/flex-slave.service';

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
        private readonly solutionInformationService: SolutionInformationService,
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
        private readonly catapushMessageProducer: CatapushMessageProducer,
        private readonly flexSlaveService: FlexSlaveService,
    ) {}

    async findById(id: Types.ObjectId): Promise<FileService> {
        return this.fileServiceModel.findById(id).lean<FileService>();
    }

    async findSingleById(id: Types.ObjectId, adminId: Types.ObjectId, authUser: IAuthUser): Promise<FileService> {
        const query = { _id: id };

        if (!this.isSuperAdminId(authUser.admin)) {
            query['admin'] = adminId;
        }

        return this.fileServiceModel
            .findOne(query)
            .populate({
                path: 'customer',
                select: 'firstName lastName email',
            })
            .populate({
                path: 'car',
                select: 'name makeType logo',
            })
            .populate({
                path: 'controller',
                select: 'name',
            })
            .populate({
                path: 'modUpload.uploadedBy',
                select: 'firstName lastName',
            })
            .lean<FileService>();
    }

    async findByCustomerId(customerId: Types.ObjectId): Promise<FileService[]> {
        return this.fileServiceModel
            .find({ customer: customerId })
            .select('-iniFile -modWithoutEncoded -decodedFile')
            .sort({ createdAt: -1 })
            .lean<FileService[]>();
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
                                { case: { $eq: ['$status', FILE_SERVICE_STATUS.PROGRESS] }, then: 3 },
                            ],
                            default: 4,
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

    async downloadFile(key: string) {
        return this.storageService.download(key);
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

        if (automatisationDto.slaveType === SLAVE_TYPE.FLEX_SLAVE) {
            if (!customer.flexSlaveSn) throw new BadRequestException('You need to add flex slave serial number');
        }

        const tempFileData = new this.tempFileServiceModel(automatisationDto);

        const fileServicePath = path.join(
            this.pathService.getFileServicePath(automatisationDto.admin, tempFileData._id as Types.ObjectId),
        );

        if (!fs.existsSync(fileServicePath)) {
            await fs.promises.mkdir(fileServicePath, { recursive: true });
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
            const customerUnique = shortid.generate();

            const kess3 = await this.kess3Service.decodeFile({
                adminId: automatisationDto.admin,
                documentId: tempFileData._id as Types.ObjectId,
                uniqueId: customerUnique,
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
                documentId: tempFileData._id as Types.ObjectId,
                filePath,
            });
            tempFileData.autoTuner = autoTuner;
            tempFileData.decodedFile = autoTuner.decodedFileName;
            filePath = autoTuner.decodedFilePath;
        } else if (automatisationDto.slaveType === SLAVE_TYPE.AUTO_FLASHER) {
            const autoFlasher = await this.autoFlasherService.decode({
                adminId: automatisationDto.admin,
                uniqueId: automatisationDto.customer.toString(),
                documentId: tempFileData._id as Types.ObjectId,
                filePath,
            });
            tempFileData.autoFlasher = autoFlasher;
            tempFileData.decodedFile = autoFlasher.decodedFileName;
            filePath = autoFlasher.decodedFilePath;
        } else if (automatisationDto.slaveType === SLAVE_TYPE.FLEX_SLAVE) {
            const uniqueId = shortid.generate();
            const flexSlave = await this.flexSlaveService.decrypt({
                adminId: automatisationDto.admin,
                documentId: tempFileData._id as Types.ObjectId,
                sn: customer.flexSlaveSn,
                filePath,
                uniqueId,
            });
            tempFileData.flexSlave = {
                ...flexSlave,
                sn: customer.flexSlaveSn,
            };
            tempFileData.decodedFile = flexSlave.decodedFileName;
            filePath = flexSlave.decodedFilePath;
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

            const requiredCredits = this.calculateCredits(
                selectedSolutionCategory,
                allSolution,
                pricing,
                tempFileService.makeType,
            );

            const allAdminPricing = await this.adminPricingService.getAdminAllPricing();

            const adminData = await this.adminService.findByIdAndSelect(admin, [
                'category',
                'credits',
                'aiAssist',
                'email',
                'user',
            ]);

            let requiredAdminCredits = this.isSuperAdminId(prepareSolutionDto.admin) ? 0 : allAdminPricing.perFilePrice;

            if (!this.isSuperAdminId(prepareSolutionDto.admin) && adminData.aiAssist) {
                const pricingWithCategory = allAdminPricing[tempFileService.makeType.toLowerCase()];
                const adminPricing = pricingWithCategory[adminData.category.toLowerCase()];
                requiredAdminCredits = this.calculateAdminCredits(selectedSolutionCategory, adminPricing);
            }

            console.log('requiredAdminCredits', requiredAdminCredits);

            if (!this.isSuperAdminId(prepareSolutionDto.admin) && requiredAdminCredits > adminData.credits) {
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

            //this path using temp service file id
            const oldFileServicePath = this.pathService.getFileServicePath(
                admin,
                tempFileService._id as Types.ObjectId,
            );

            //this path using permanent service file id
            fileServicePath = this.pathService.getFileServicePath(admin, newFileService._id as Types.ObjectId);

            //rename files from old to new
            await fs.promises.rename(oldFileServicePath, fileServicePath);

            //read the bin file
            let binFileBuffer: Buffer;
            if (!tempFileService.slaveType) {
                binFileBuffer = await fs.promises.readFile(path.join(fileServicePath, tempFileService.originalFile));
            } else {
                binFileBuffer = await fs.promises.readFile(path.join(fileServicePath, tempFileService.decodedFile));

                newFileService.slaveType = tempFileService.slaveType;
                if (tempFileService.slaveType === SLAVE_TYPE.AUTO_TUNER) {
                    newFileService.autoTuner = {
                        ecu_id: tempFileService.autoTuner.ecu_id,
                        mcu_id: tempFileService.autoTuner.mcu_id,
                        mode: tempFileService.autoTuner.mode,
                        model_id: tempFileService.autoTuner.model_id,
                        slave_id: tempFileService.autoTuner.slave_id,
                    };
                } else if (tempFileService.slaveType === SLAVE_TYPE.AUTO_FLASHER) {
                    newFileService.autoFlasher = {
                        memory_type: tempFileService.autoFlasher.memory_type,
                        serialNumber: tempFileService.autoFlasher.serialNumber,
                    };
                } else if (tempFileService.slaveType === SLAVE_TYPE.KESS3) {
                    newFileService.kess3 = {
                        fileSlotGUID: tempFileService.kess3.fileSlotGUID,
                        fileType: tempFileService.kess3.fileType,
                        isCVNCorrectionPossible: tempFileService.kess3.isCVNCorrectionPossible,
                        mode: tempFileService.kess3.mode,
                        uniqueId: tempFileService.kess3.uniqueId,
                    };
                } else if (tempFileService.slaveType === SLAVE_TYPE.FLEX_SLAVE) {
                    newFileService.flexSlave = {
                        sn: tempFileService.flexSlave.sn,
                    };
                }
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
                    encodedPath = await this.encodeModifiedFile(modifiedPath, newFileService);
                    tempFileService.modFile = path.basename(encodedPath);
                }

                //update customer credit and admin credit if file is ready
                await this.customerService.updateCredit(customer._id as Types.ObjectId, -requiredCredits, session);

                newFileService.paymentStatus = PAYMENT_STATUS.PAID;
                newFileService.status = FILE_SERVICE_STATUS.COMPLETED;

                //reduce the admin credit
                await this.adminService.updateCredit(admin, -requiredAdminCredits, session);
            }

            tempFileService.service = newFileService._id as Types.ObjectId;
            await tempFileService.save();

            const uploadPayLoad: { name: string; path: string; keyIdentifier: string }[] = [];

            //original file
            const originalFilePath = path.join(fileServicePath, tempFileService.originalFile);

            uploadPayLoad.push({
                keyIdentifier: 'originalFile',
                name: tempFileService.originalFile,
                path: originalFilePath,
            });

            //upload ini file
            const iniFilePath = path.join(fileServicePath, tempFileService.iniFile);

            uploadPayLoad.push({
                keyIdentifier: 'iniFile',
                name: tempFileService.iniFile,
                path: iniFilePath,
            });

            if (tempFileService.decodedFile) {
                //decoded file
                const decodedFilePath = path.join(fileServicePath, tempFileService.decodedFile);

                uploadPayLoad.push({
                    keyIdentifier: 'decodedFile',
                    name: tempFileService.decodedFile,
                    path: decodedFilePath,
                });
            }

            if (modifiedPath) {
                uploadPayLoad.push({
                    keyIdentifier: 'modFile',
                    name: path.basename(modifiedPath),
                    path: modifiedPath,
                });
            }

            //encoded file
            if (encodedPath) {
                uploadPayLoad.push({
                    keyIdentifier: 'encodedFile',
                    name: path.basename(encodedPath),
                    path: encodedPath,
                });
            }

            const uploadFiles = await this.storageService.bulkUpload(newFileService._id.toString(), uploadPayLoad);

            for (const upload of uploadFiles) {
                if (upload.keyIdentifier === 'originalFile') {
                    newFileService.originalFile = {
                        key: upload.key,
                        originalname: tempFileService.originalFileName,
                        uniqueName: tempFileService.originalFile,
                    };
                } else if (upload.keyIdentifier === 'iniFile') {
                    newFileService.iniFile = {
                        key: upload.key,
                        originalname: tempFileService.iniFile,
                        uniqueName: tempFileService.iniFile,
                    };
                } else if (upload.keyIdentifier === 'decodedFile') {
                    newFileService.decodedFile = {
                        key: upload.key,
                        originalname: tempFileService.decodedFile,
                        uniqueName: tempFileService.decodedFile,
                    };
                } else if (upload.keyIdentifier === 'modFile') {
                    if (encodedPath) {
                        newFileService.modWithoutEncoded = {
                            key: upload.key,
                            originalname: path.basename(modifiedPath),
                            uniqueName: path.basename(modifiedPath),
                        };
                    } else {
                        newFileService.modFile = {
                            key: upload.key,
                            originalname: path.basename(modifiedPath),
                            uniqueName: path.basename(modifiedPath),
                        };
                    }
                } else if (upload.keyIdentifier === 'encodedFile') {
                    newFileService.modFile = {
                        key: upload.key,
                        originalname: path.basename(encodedPath),
                        uniqueName: path.basename(encodedPath),
                    };
                }
            }

            const chatPayload = [];

            if (prepareSolutionDto.comments) {
                //send the comment in the chat
                chatPayload.push(
                    this.chatService.create(
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
                    ),
                );
            }

            if (!requestedSolutions.length) {
                //set solution information data as initial admin/super admin chat message
                const solutionInformation = await this.solutionInformationService.getSolutionInformationByProperty(
                    newFileService.controller,
                    allSolution,
                );

                if (solutionInformation.length) {
                    let contents = 'INFO: ';
                    solutionInformation.forEach((item) => {
                        if (item.content) {
                            contents += '\n' + item.solution.aliasName + ': ' + item.content;
                        }
                    });
                    if (contents.length > 6) {
                        chatPayload.push(
                            this.chatService.create(
                                {
                                    admin: admin as Types.ObjectId,
                                    chatBelong: CHAT_BELONG.FILE_SERVICE,
                                    customer: customer._id as Types.ObjectId,
                                    message: contents,
                                    receiver: customer._id as Types.ObjectId,
                                    service: newFileService._id as Types.ObjectId,
                                    sender: adminData.user as Types.ObjectId,
                                    messageSenderGroup: this.isSuperAdminId(admin)
                                        ? CHAT_MESSAGE_SENDER_GROUP.SUPER_ADMIN_GROUP
                                        : CHAT_MESSAGE_SENDER_GROUP.ADMIN_GROUP,
                                },
                                null,
                                session,
                            ),
                        );
                    }
                }
            }

            if (chatPayload.length) {
                await Promise.all(chatPayload);
            }

            const result = await newFileService.save({ session });

            await session.commitTransaction();

            //send the request to the queue for winols
            if (requestedSolutions.length) {
                const adminData = await this.adminService.findById(admin);

                if (adminData.enabledWinols) {
                    //send the request to the queue for winols
                    this.fileProcessProducer.processFile({ fileServiceData: newFileService, admin: adminData });
                }
            }

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

                const message = `Customer ${customer.firstName} ${customer.lastName} has requested a solution for the file ${newFileService.uniqueId}.`;

                this.catapushMessageProducer.sendCatapushMessage(prepareSolutionDto.admin, message, 'admin');
            }

            return result;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    private encodeModifiedFile(modifiedFilePath: string, fileService: FileService) {
        if (fileService.slaveType === SLAVE_TYPE.KESS3) {
            return this.kess3Service.encodeFile(
                {
                    uniqueId: fileService.kess3.uniqueId,
                    documentId: fileService._id as Types.ObjectId,
                    filePath: modifiedFilePath,
                    fileSlotGUID: fileService.kess3.fileSlotGUID,
                    fileType: fileService.kess3.fileType,
                    isCVNCorrectionPossible: fileService.kess3.isCVNCorrectionPossible,
                    mode: fileService.kess3.mode,
                },
                fileService.admin,
            );
        } else if (fileService.slaveType === SLAVE_TYPE.AUTO_TUNER) {
            return this.autoTunerService.encode({
                documentId: fileService._id as Types.ObjectId,
                adminId: fileService.admin,
                ecu_id: fileService.autoTuner.ecu_id,
                filePath: modifiedFilePath,
                mcu_id: fileService.autoTuner.mcu_id,
                model_id: fileService.autoTuner.model_id,
                slave_id: fileService.autoTuner.slave_id,
            });
        } else if (fileService.slaveType === SLAVE_TYPE.AUTO_FLASHER) {
            return this.autoFlasherService.encode({
                documentId: fileService._id as Types.ObjectId,
                adminId: fileService.admin,
                filePath: modifiedFilePath,
                memory_type: fileService.autoFlasher.memory_type,
                serialNumber: fileService.autoFlasher.serialNumber,
            });
        } else if (fileService.slaveType === SLAVE_TYPE.FLEX_SLAVE) {
            return this.flexSlaveService.encrypt({
                adminId: fileService.admin,
                documentId: fileService._id as Types.ObjectId,
                filePath: modifiedFilePath,
                sn: fileService.flexSlave.sn,
            });
        }
    }

    async matchScriptAndSolution(fileBufferContent: Buffer, scriptPath: string, solutions: Solution[]) {
        const scriptFiles = await fs.promises.readdir(scriptPath);

        const limit = pLimit(20);
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
                    console.log(scriptFile);
                    const solution = this.getMatchSolution(scriptFile, solutions);
                    console.log('solution', solution);
                    if (solution) {
                        acc.push({
                            solution: { _id: solution._id.toString(), name: solution.name },
                            fileName: scriptFile,
                        });
                    }
                }
                return acc;
            },
            [] as { fileName: string; solution: { _id: string; name: string } }[],
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

    private calculateCredits(
        services: SOLUTION_CATEGORY[],
        selectedSolutions: Types.ObjectId[],
        pricing: Pricing,
        makeType: MAKE_TYPE_ENUM,
    ) {
        let totalCredits = 0;
        //handle car
        if (makeType) {
            if (pricing.enabledPricingType === PRICING_TYPE_ENUM.SOLUTION_BASED) {
                const pricingItems = pricing.solutionItems.filter((item) => item.makeType === makeType);
                for (const solution of selectedSolutions) {
                    const item = pricingItems.find(
                        (item: any) =>
                            item.solution._id.toString() === solution.toString() &&
                            item.solution.makeTypes.includes(makeType),
                    );
                    console.log('item', item);
                    if (item) {
                        totalCredits += item.price;
                    }
                }

                if (totalCredits === 0) {
                    const minPrice = pricing.priceLimits.find((item) => item.makeType === makeType).minPrice;
                    totalCredits = minPrice;
                }

                const maxPrice = pricing.priceLimits.find((item) => item.makeType === makeType).maxPrice;
                if (totalCredits > maxPrice) {
                    totalCredits = maxPrice;
                }

                console.log('totalPrice', totalCredits);
            } else {
                const pricingItems = pricing.items.filter((item) => item.makeType === makeType);
                for (const service of services) {
                    const item = pricingItems.find((item) => item.solutionCategory === service);
                    if (item) {
                        totalCredits += item.price;
                    }
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
    async fileProcess(fileService: FileService, admin: Admin) {
        //change the file status to processing
        await this.fileServiceModel.updateOne(
            { _id: fileService._id },
            { $set: { winolsStatus: WinOLS_STATUS.WinOLS_PROGRESS } },
        );

        //get the bin file path from temp file or download from the s3
        let binFilePath = '';

        const fileServicePath = this.pathService.getFileServicePath(
            fileService.admin,
            fileService._id as Types.ObjectId,
        );

        console.log('fileServicePath->true===>', fileServicePath);

        //check service is slave or not
        if (!fileService.slaveType) {
            //if not slave then original file is the  bin file
            binFilePath = path.join(fileServicePath, fileService.originalFile.uniqueName);
            console.log('binFilePath->slave->false===>', binFilePath);
        } else {
            //if slave file then decoded file is the bin file
            binFilePath = path.join(fileServicePath, fileService.decodedFile.uniqueName);
            console.log('binFilePath->slave->true===>', binFilePath);
        }

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

        if (!fs.existsSync(inputPath)) {
            await fs.promises.mkdir(inputPath, { recursive: true });
        }
        if (!fs.existsSync(outputPath)) {
            await fs.promises.mkdir(outputPath, { recursive: true });
        }

        //copy the binfile to the winols input folder
        await fs.promises.copyFile(binFilePath, path.join(inputPath, fileService.originalFile.uniqueName));
        console.log('copped to the winols in folder done');

        console.log('waiting for 70 seconds');
        await timeOutAsync(70000);
        console.log('waited for 70 seconds');

        //define exists
        let outFileExits = fs.existsSync(outputPath);

        let attempts = 0;

        while (!outFileExits) {
            if (attempts > 5) {
                break;
            }
            //wait for 5 seconds
            console.log('waiting for 5 seconds');
            await timeOutAsync(5000);
            attempts += 1;
            outFileExits = fs.existsSync(outputPath);
            console.log('outFileExits==>', outFileExits, 'attempts==>', attempts);
        }

        if (!outFileExits) {
            throw new BadRequestException('Out File not found');
        }

        console.log('out file is exist');
        let outFiles = await fs.promises.readdir(outputPath);

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
            outFiles = await fs.promises.readdir(outputPath);
            currentFileCount = outFiles.length;

            if (previousFileCount < currentFileCount) {
                console.log('got new file');
                console.log('outFiles', outFiles);

                attempts = 0;
                previousFileCount = currentFileCount;
            } else {
                console.log('no new file');
                console.log('outFiles', outFiles);
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
        fileService: FileService,
        admin: Admin,
        data: {
            binFilePath: string;
            outFiles: string[];
            outputPath: string;
        },
    ) {
        const session = await this.connection.startSession();
        const fileServiceId = fileService._id as Types.ObjectId;
        try {
            session.startTransaction();
            console.log('Build process start');
            console.log(data);

            //get the requested and automatic solution
            const requested = fileService.solutions.requested as unknown as string[];
            const automatic = fileService.solutions.automatic;

            console.log('solutions requested==>', requested);
            console.log('solutions automatic==>', automatic);

            await this.updateWinolsStatus(fileServiceId, WinOLS_STATUS.BUILD_PROGRESS);

            //get solution without automatic solution, because these are already automatic
            const solutionWithoutAutomatic = await this.findSolutionWithoutAutomaticSolution(
                automatic.map((s) => s.toString()),
            );
            //declare modFiles
            const modFiles = [];

            const matchedSolution = [];

            //loop over the outFiles and match with requested solution
            for (const file of data.outFiles) {
                //get matched file
                const matchSolution = this.getMatchSolution(file, solutionWithoutAutomatic);
                if (matchSolution) {
                    //if matched then push into mod file
                    modFiles.push({
                        name: file,
                        path: path.join(data.outputPath, file),
                    });

                    matchedSolution.push(matchSolution);

                    const findRequestedIndex = requested.findIndex(
                        (r) => r.toString() === matchSolution._id.toString(),
                    );

                    if (findRequestedIndex !== -1) {
                        requested.splice(findRequestedIndex, 1);
                        automatic.push(matchSolution._id as Types.ObjectId);
                    }
                }
            }

            console.log('new  requested==>', requested);
            console.log('new  automatic==>', automatic);

            console.log('mod file after matching===>', modFiles);

            //make scrips using the modFiles which is getting from the lua
            const originalFileContent = await fs.promises.readFile(data.binFilePath);

            //find car and controller
            const car = await this.carService.findByIdAndSelect(fileService.car, ['name', 'makeType']);
            const controller = await this.controllerService.findByIdAndSelect(fileService.controller, ['name']);

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

                if (admin.credits < fileService.adminCredits) throw new BadRequestException('Not enough admin credits');

                const customer = await this.customerService.findByIdAndSelect(fileService.customer, [
                    'firstName',
                    'lastName',
                    'email',
                    'phone',
                    'countryCode',
                    'credits',
                ]);

                if (customer.credits < fileService.credits) throw new BadRequestException('Not enough credits');

                const buildData = await this.buildSolution(fileService, data.binFilePath, completeScriptPath, session);
                //Send email for file confirmation
                this.emailQueueProducers.sendMail({
                    receiver: customer.email,
                    name: customer.firstName + ' ' + customer.lastName,
                    emailType: EMAIL_TYPE.fileReady,
                    uniqueId: fileService.uniqueId,
                });

                const message = `Your mod file for the file service ID ${fileService.uniqueId} is ready to download.`;
                const phone = `${customer.countryCode.replace('+', '')}${customer.phone}`;
                this.catapushMessageProducer.sendCatapushMessage(fileService.admin, message, 'customer', phone);

                delete buildData.fileService._id;

                buildData.fileService.winolsStatus = WinOLS_STATUS.WinOLS_OK;

                //update the requested and automatic solution
                buildData.fileService.solutions.requested = requested as unknown as Types.ObjectId[];
                buildData.fileService.solutions.automatic = automatic;

                //update file service and temp file
                await this.fileServiceModel.findByIdAndUpdate(
                    fileServiceId,
                    { $set: buildData.fileService },
                    { session },
                );
            } else {
                await this.fileServiceModel.findByIdAndUpdate(
                    fileServiceId,
                    {
                        $set: {
                            winolsStatus: WinOLS_STATUS.WinOLS_FAILED,
                            solutions: {
                                requested,
                                automatic,
                            },
                        },
                    },
                    { session },
                );
            }

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async findSolutionWithoutAutomaticSolution(automatics: string[]) {
        const solutions = await this.solutionService.findAll();

        return solutions.filter((solution) => !automatics.includes(solution._id.toString()));
    }

    async buildSolution(fileService: FileService, binFilePath: string, scriptPath: string, session: ClientSession) {
        console.log('Build start');

        // Combine requested and automatic solutions
        const solutions = [...fileService.solutions.requested, ...fileService.solutions.automatic];

        let requestedSolutionIds = [...fileService.solutions.requested];
        console.log('Combined solutions:', solutions);

        // Read binary file
        const fileBufferContent = await fs.promises.readFile(binFilePath);

        // Fetch solution data
        const solutionsData = await this.solutionService.findByIds(solutions);

        // Match solutions
        const matchedSolutions = await this.matchScriptAndSolution(fileBufferContent, scriptPath, solutionsData);
        console.log('Matched Solutions:', matchedSolutions);

        // Extract solution names and IDs
        const newAutomaticSolutionId = new Set(matchedSolutions.map((sol) => sol.solution._id));

        const allSolutionNames = [...new Set(matchedSolutions.map((sol) => sol.solution.name))];

        console.log(newAutomaticSolutionId, allSolutionNames);
        // Remove matched solutions from requested list
        requestedSolutionIds = requestedSolutionIds.filter((id) => !newAutomaticSolutionId.has(id.toString()));

        // Ensure all requested solutions are matched
        if (requestedSolutionIds.length) {
            const missingSolutions = await this.solutionService.findByIdsAndDistinctName(requestedSolutionIds);
            throw new BadRequestException('Missing Solution: ' + missingSolutions.join(', '));
        }

        // Modify file content
        for (const { fileName } of matchedSolutions) {
            const filePath = path.join(scriptPath, fileName);
            const contents = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));

            for (const { position, file2ByteHex } of contents.differences) {
                if (position < fileBufferContent.length) {
                    fileBufferContent[position] = parseInt(file2ByteHex, 16);
                }
            }
        }

        // Define modified file names and paths
        const modifiedFileName = `MOD_${allSolutionNames.join('_')}_${fileService.originalFile.originalname.replace(/Original/i, 'modified')}`;
        const fileServicePath = this.pathService.getFileServicePath(
            fileService.admin,
            fileService._id as Types.ObjectId,
        );
        const modifiedPath = path.join(fileServicePath, modifiedFileName);
        console.log('Modified File Path:', modifiedPath);

        // Write modified file
        await fs.promises.writeFile(modifiedPath, fileBufferContent);

        // Encode file if necessary
        const encodedPath = await this.encodeModifiedFile(modifiedPath, fileService);
        console.log('Encoded Path:', encodedPath);

        // Handle payment status and credits
        if (fileService.paymentStatus === PAYMENT_STATUS.UNPAID) {
            await this.customerService.updateCredit(
                fileService.customer as Types.ObjectId,
                -fileService.credits,
                session,
            );
            await this.adminService.updateCredit(
                fileService.admin as Types.ObjectId,
                -fileService.adminCredits,
                session,
            );
            fileService.paymentStatus = PAYMENT_STATUS.PAID;
            fileService.status = FILE_SERVICE_STATUS.COMPLETED;

            //set solution information data as initial admin/super admin chat message
            const solutionInformation = await this.solutionInformationService.getSolutionInformationByProperty(
                fileService.controller,
                fileService.solutions.requested.concat(fileService.solutions.automatic),
            );

            const admin = await this.adminService.findByIdAndSelect(fileService.admin, ['user']);
            const customer = await this.customerService.findByIdAndSelect(fileService.customer, ['_id']);

            if (solutionInformation.length) {
                let contents = 'INFO: ';
                solutionInformation.forEach((item) => {
                    if (item.content) {
                        contents += '\n' + item.solution.aliasName + ': ' + item.content;
                    }
                });
                if (contents.length > 6) {
                    await this.chatService.create(
                        {
                            admin: admin._id as Types.ObjectId,
                            chatBelong: CHAT_BELONG.FILE_SERVICE,
                            customer: customer._id as Types.ObjectId,
                            message: contents,
                            receiver: customer._id as Types.ObjectId,
                            service: fileService._id as Types.ObjectId,
                            sender: admin.user as Types.ObjectId,
                            messageSenderGroup: this.isSuperAdminId(admin._id)
                                ? CHAT_MESSAGE_SENDER_GROUP.SUPER_ADMIN_GROUP
                                : CHAT_MESSAGE_SENDER_GROUP.ADMIN_GROUP,
                        },
                        null,
                        session,
                    );
                }
            }
        }

        // Upload modified file
        console.log('Starting upload...');
        const modifiedUpload = await this.storageService.upload(fileService._id.toString(), {
            name: path.basename(modifiedPath),
            path: modifiedPath,
        });

        if (encodedPath) {
            const encodedUpload = await this.storageService.upload(fileService._id.toString(), {
                name: path.basename(encodedPath),
                path: encodedPath,
            });
            fileService.modFile = {
                key: encodedUpload,
                originalname: path.basename(encodedPath),
                uniqueName: path.basename(encodedPath),
            };
        } else {
            fileService.modFile = {
                key: modifiedUpload,
                originalname: path.basename(modifiedPath),
                uniqueName: path.basename(modifiedPath),
            };
        }

        console.log('Upload completed.');
        return { fileService };
    }

    async updateAiAssistant(fileServiceId: Types.ObjectId, aiAssist: boolean) {
        return await this.fileServiceModel.findByIdAndUpdate(fileServiceId, { $set: { aiAssist } }, { new: true });
    }

    isSuperAdminId(adminId: Types.ObjectId) {
        return adminId.toString() === process.env.SUPER_ADMIN_ID.toString();
    }

    async uploadModFile(fileServiceId: Types.ObjectId, modFile: Express.Multer.File, authUser: IAuthUser) {
        const session = await this.connection.startSession();
        let encodedPath = '';
        let modFileUploaded = '';
        try {
            session.startTransaction();

            if (!modFile) {
                throw new BadRequestException('Please provide modFile');
            }

            const fileService = await this.fileServiceModel.findById(fileServiceId);

            if (!fileService) {
                throw new NotFoundException('File not found');
            }

            const admin = await this.adminService.findByIdAndSelect(fileService.admin, ['email', 'user']);

            const customer = await this.customerService.findByIdAndSelect(fileService.customer, [
                'firstName',
                'lastName',
                'email',
                'credits',
                'countryCode',
                'phone',
            ]);

            if (!this.isSuperAdminId(fileService.admin)) {
                if (fileService.credits > admin.credits) {
                    throw new BadRequestException('Error 01 - Please contact Portal Owner');
                } else {
                    await this.adminService.updateCredit(
                        fileService.admin as Types.ObjectId,
                        -fileService.adminCredits,
                        session,
                    );
                }
            }

            if (customer.credits < fileService.credits) {
                throw new BadRequestException("Customer don't have enough credits");
            } else {
                await this.customerService.updateCredit(
                    fileService.customer as Types.ObjectId,
                    -fileService.credits,
                    session,
                );
            }

            if (fileService.slaveType) {
                encodedPath = await this.encodeModifiedFile(modFile.path, fileService);
                //upload file to s3
                const encodedUpload = await this.storageService.upload(fileService._id.toString(), {
                    name: path.basename(encodedPath),
                    path: encodedPath,
                });
                modFileUploaded = encodedUpload;
                fileService.modFile = {
                    key: encodedUpload,
                    originalname: path.basename(encodedPath),
                    uniqueName: path.basename(encodedPath),
                };
            } else {
                if (modFile) {
                    const modifiedUpload = await this.storageService.upload(fileService._id.toString(), {
                        name: path.basename(modFile.path),
                        path: modFile.path,
                    });
                    modFileUploaded = modifiedUpload;
                    fileService.modFile = {
                        key: modifiedUpload,
                        originalname: path.basename(modFile.originalname),
                        uniqueName: path.basename(modFile.filename),
                    };
                }
            }
            fileService.status = FILE_SERVICE_STATUS.COMPLETED;
            fileService.paymentStatus = PAYMENT_STATUS.PAID;

            //set solution information data as initial admin/super admin chat message
            const solutionInformation = await this.solutionInformationService.getSolutionInformationByProperty(
                fileService.controller,
                fileService.solutions.requested.concat(fileService.solutions.automatic),
            );

            if (solutionInformation.length) {
                let contents = 'INFO: ';
                solutionInformation.forEach((item) => {
                    if (item.content) {
                        contents += '\n' + item.solution.aliasName + ': ' + item.content;
                    }
                });
                if (contents.length > 6) {
                    await this.chatService.create(
                        {
                            admin: admin._id as Types.ObjectId,
                            chatBelong: CHAT_BELONG.FILE_SERVICE,
                            customer: customer._id as Types.ObjectId,
                            message: contents,
                            receiver: customer._id as Types.ObjectId,
                            service: fileService._id as Types.ObjectId,
                            sender: admin.user as Types.ObjectId,
                            messageSenderGroup: this.isSuperAdminId(admin._id)
                                ? CHAT_MESSAGE_SENDER_GROUP.SUPER_ADMIN_GROUP
                                : CHAT_MESSAGE_SENDER_GROUP.ADMIN_GROUP,
                        },
                        null,
                        session,
                    );
                }
            }

            fileService.modUpload = {
                date: new Date(),
                uploadedBy: authUser._id,
            };

            await fileService.save({ session });

            await session.commitTransaction();

            const message = `Your mod file for the file service ID ${fileService.uniqueId} is ready to download.`;
            const phone = `${customer.countryCode.replace('+', '')}${customer.phone}`;
            this.catapushMessageProducer.sendCatapushMessage(fileService.admin, message, 'customer', phone);

            //send email after all the job done
            this.emailQueueProducers.sendMail({
                receiver: customer.email,
                name: customer.firstName + ' ' + customer.lastName,
                emailType: EMAIL_TYPE.fileReady,
                uniqueId: fileService.uniqueId,
            });

            return this.fileServiceModel
                .findById(fileService._id)
                .populate({
                    path: 'customer',
                    select: 'firstName lastName customerType',
                })
                .populate({
                    path: 'car',
                    select: 'name logo',
                })
                .populate({
                    path: 'controller',
                    select: 'name',
                });
        } catch (error) {
            await session.abortTransaction();
            //if any error occurred after uploading the modFile to mega then have to delete it
            if (modFileUploaded) {
                await this.storageService.delete(fileServiceId.toString(), modFileUploaded);
            }
            throw error;
        } finally {
            await session.endSession();
            //delete the uploaded mod file and encoded file from local
            if (fs.existsSync(modFile.path)) {
                await fs.promises.rm(modFile.path, { recursive: true, force: true });
            }
            if (fs.existsSync(encodedPath)) {
                await fs.promises.rm(encodedPath, { recursive: true, force: true });
            }
        }
    }

    async manualBuild(fileServiceId: Types.ObjectId) {
        let binFilePath = '';
        let oldModFile = '';
        let oldModWithOutEncodedKey = '';

        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            const fileService = await this.fileServiceModel.findById(fileServiceId).lean<FileService>();
            if (!fileService) {
                throw new NotFoundException('File Service Not Found');
            }

            if (fileService.modFile) {
                oldModFile = fileService.modFile.key;
            }

            if (fileService.modWithoutEncoded) {
                oldModWithOutEncodedKey = fileService.modWithoutEncoded.key;
            }

            const admin = await this.adminService.findByIdAndSelect(fileService.admin, ['email', 'user']);

            const customer = await this.customerService.findByIdAndSelect(fileService.customer, [
                'firstName',
                'lastName',
                'email',
                'credits',
                'countryCode',
                'phone',
            ]);

            //if status is unpaid and not enough credits then throw error
            if (fileService.paymentStatus === PAYMENT_STATUS.UNPAID) {
                if (!this.isSuperAdminId(fileService.admin) && fileService.credits > admin.credits) {
                    throw new BadRequestException('Error 01 - Please contact Portal Owner');
                }

                if (customer.credits < fileService.credits) {
                    throw new BadRequestException("Customer don't have enough credits");
                }
            }

            const fileServicePath = this.pathService.getFileServicePath(
                fileService.admin,
                fileService._id as Types.ObjectId,
            );

            if (!fs.existsSync(fileServicePath)) {
                await fs.promises.mkdir(fileServicePath);
            }

            //get script path
            const car = await this.carService.findByIdAndSelect(fileService.car, ['makeType', 'name']);

            const controller = await this.controllerService.findByIdAndSelect(fileService.controller, ['name']);

            let scripPath = this.pathService.getCompleteScriptPath(
                fileService.admin,
                car.makeType,
                car.name,
                controller.name,
            );

            if (fileService.aiAssist || this.isSuperAdminId(fileService.admin)) {
                scripPath = this.pathService.getAiScriptPath(car.makeType, car.name, controller.name);
            }

            let key = '';

            //download the original file
            if (fileService.slaveType) {
                binFilePath = path.join(fileServicePath, fileService.decodedFile.uniqueName);
                key = fileService.decodedFile.key;
            } else {
                binFilePath = path.join(fileServicePath, fileService.originalFile.uniqueName);
                key = fileService.originalFile.key;
            }

            if (!fs.existsSync(binFilePath)) {
                const fileData = await this.storageService.download(key);
                await fs.promises.writeFile(binFilePath, fileData);
                console.log('file downloaded');
            }

            const buildData = await this.buildSolution(fileService, binFilePath, scripPath, session);
            delete buildData.fileService._id;
            //update file service and temp file
            const updatedFileService = await this.fileServiceModel
                .findByIdAndUpdate(fileServiceId, { $set: buildData.fileService }, { session, new: true })
                .populate({
                    path: 'customer',
                    select: 'firstName lastName customerType',
                })
                .populate({
                    path: 'car',
                    select: 'name logo',
                })
                .populate({
                    path: 'controller',
                    select: 'name',
                });

            if (fileService.paymentStatus === PAYMENT_STATUS.UNPAID) {
                const message = `Your mod file for the file service ID ${fileService.uniqueId} is ready to download.`;
                const phone = `${customer.countryCode.replace('+', '')}${customer.phone}`;
                this.catapushMessageProducer.sendCatapushMessage(fileService.admin, message, 'customer', phone);

                //send email after all the job done
                this.emailQueueProducers.sendMail({
                    receiver: customer.email,
                    name: customer.firstName + ' ' + customer.lastName,
                    emailType: EMAIL_TYPE.fileReady,
                    uniqueId: fileService.uniqueId,
                });

                //set solution information data as initial admin/super admin chat message
                const solutionInformation = await this.solutionInformationService.getSolutionInformationByProperty(
                    fileService.controller,
                    fileService.solutions.requested.concat(fileService.solutions.automatic),
                );

                if (solutionInformation.length) {
                    let contents = 'INFO: ';
                    solutionInformation.forEach((item) => {
                        if (item.content) {
                            contents += '\n' + item.solution.aliasName + ': ' + item.content;
                        }
                    });
                    if (contents.length > 6) {
                        await this.chatService.create(
                            {
                                admin: admin._id as Types.ObjectId,
                                chatBelong: CHAT_BELONG.FILE_SERVICE,
                                customer: customer._id as Types.ObjectId,
                                message: contents,
                                receiver: customer._id as Types.ObjectId,
                                service: fileService._id as Types.ObjectId,
                                sender: admin.user as Types.ObjectId,
                                messageSenderGroup: this.isSuperAdminId(admin._id)
                                    ? CHAT_MESSAGE_SENDER_GROUP.SUPER_ADMIN_GROUP
                                    : CHAT_MESSAGE_SENDER_GROUP.ADMIN_GROUP,
                            },
                            null,
                            session,
                        );
                    }
                }
            }

            //for avoid already committing error of transaction we wrap this deleting process using try catch, so that if it give any error then it doesn't pass to the parent function

            //if old and new file service both is paid that means admin click build for correction
            if (fileService.paymentStatus === PAYMENT_STATUS.PAID) {
                console.log('entered');
                if (oldModFile) {
                    await this.storageService.delete(fileServiceId.toString(), oldModFile);
                }
                if (oldModWithOutEncodedKey) {
                    await this.storageService.delete(fileServiceId.toString(), oldModWithOutEncodedKey);
                }
            }

            await session.commitTransaction();

            return updatedFileService;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async closeFileService(fileServiceId: Types.ObjectId) {
        return await this.fileServiceModel.findByIdAndUpdate(
            fileServiceId,
            { $set: { status: FILE_SERVICE_STATUS.CLOSED } },
            { new: true },
        );
    }

    async progressFileService(fileServiceId: Types.ObjectId) {
        const fileService = await this.fileServiceModel
            .findById(fileServiceId)
            .populate({
                path: 'customer',
                select: 'firstName lastName customerType',
            })
            .populate({
                path: 'car',
                select: 'name logo',
            })
            .populate({
                path: 'controller',
                select: 'name',
            })
            .lean();

        if (!fileService) {
            throw new NotFoundException('File service not found');
        }

        if (fileService.status === FILE_SERVICE_STATUS.COMPLETED || fileService.status === FILE_SERVICE_STATUS.CLOSED) {
            return fileService;
        }

        return await this.fileServiceModel
            .findByIdAndUpdate(fileServiceId, { $set: { status: FILE_SERVICE_STATUS.PROGRESS } }, { new: true })
            .populate({
                path: 'customer',
                select: 'firstName lastName customerType',
            })
            .populate({
                path: 'car',
                select: 'name logo',
            })
            .populate({
                path: 'controller',
                select: 'name',
            });
    }

    async refundFileService(fileServiceId: Types.ObjectId) {
        const session = await this.connection.startSession();
        try {
            session.startTransaction();
            const fileService = await this.fileServiceModel.findById(fileServiceId);
            if (!fileService) {
                throw new NotFoundException('File service not found');
            }
            const customer = await this.customerService.findByIdAndSelect(fileService.customer, [
                'credits',
                'firstName',
                'lastName',
                'email',
            ]);
            if (!customer) {
                throw new NotFoundException('Customer not found');
            }
            await this.customerService.updateCredit(
                fileService.customer as Types.ObjectId,
                fileService.credits,
                session,
            );

            const updatedFileService = await this.fileServiceModel.findByIdAndUpdate(
                fileServiceId,
                { status: FILE_SERVICE_STATUS.REFUNDED, paymentStatus: PAYMENT_STATUS.REFUNDED },
                { new: true },
            );

            await session.commitTransaction();

            //Send email for file confirmation
            this.emailQueueProducers.sendMail({
                receiver: customer.email,
                name: customer.firstName + ' ' + customer.lastName,
                emailType: EMAIL_TYPE.refundFileService,
                uniqueId: fileService.uniqueId,
                credits: fileService.credits,
            });

            return updatedFileService;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async deleteFileService(fileServiceId: Types.ObjectId) {
        const session = await this.connection.startSession();

        try {
            session.startTransaction();

            const fileService = await this.fileServiceModel.findById(fileServiceId);
            if (!fileService) {
                throw new NotFoundException('File service not found');
            }
            await this.fileServiceModel.findByIdAndDelete(fileServiceId, { session });

            await this.chatService.deleteManyByFileServiceId(fileServiceId, session);

            await this.storageService.deleteFolder(fileServiceId.toString());

            await session.commitTransaction();
            return fileService;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }
}
