import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { basename } from 'path';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
    CHAT_BELONG,
    CHAT_MESSAGE_SENDER_GROUP,
    collectionsName,
    EMAIL_TYPE,
    FILE_SERVICE_STATUS,
    SLAVE_TYPE,
    SUPPORT_STATUS,
} from '../constant';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { Chat } from './schema/chat.schema';
import { StorageService } from '../storage-service/storage-service.service';
import { existsSync, unlinkSync } from 'fs';
import { FileService } from '../file-service/schema/file-service.schema';
import { SupportTicket } from '../support-ticket/schema/support-ticket.schema';
import { EmailQueueProducers } from '../queue-manager/producers/email-queue.producers';
import { Customer } from '../customer/schema/customer.schema';
import { AutoTunerService } from '../auto-tuner/auto-tuner.service';
import { AutoFlasherService } from '../auto-flasher/auto-flasher.service';
import { Kess3Service } from '../kess3/kess3.service';
import { CatapushMessageProducer } from '../queue-manager/producers/catapush-message.producer';
import { Employee } from '../employee/schema/employee.schema';

@Injectable()
export class ChatService {
    constructor(
        @InjectModel(collectionsName.chat) private readonly chatModel: Model<Chat>,
        @InjectModel(collectionsName.fileService) private readonly fileServiceModal: Model<FileService>,
        @InjectModel(collectionsName.supportTicket) private readonly supportTicketModel: Model<SupportTicket>,
        @InjectModel(collectionsName.customer) private readonly customerModel: Model<Customer>,
        @InjectModel(collectionsName.employee) private readonly employeeModel: Model<Employee>,
        private readonly storageService: StorageService,
        @InjectConnection() private readonly connection: Connection,
        private readonly emailQueueProducers: EmailQueueProducers,
        private readonly autoTunerService: AutoTunerService,
        private readonly autoFlasherService: AutoFlasherService,
        private readonly kess3Service: Kess3Service,
        private readonly catapushMessageProducer: CatapushMessageProducer,
    ) {}

    async create(createChatDto: CreateChatDto, file?: Express.Multer.File, sessionParams?: ClientSession) {
        let isUploaded = false;
        let fileServiceUniqueId = '';
        let ticketUniqueId = '';
        let fileService: FileService;
        let supportTicket: SupportTicket;
        let encodedFile = '';
        let filename = '';
        let originalName = '';

        if (file) {
            filename = file.filename;
            originalName = file.originalname;
        }

        console.log('createChatDto', createChatDto);
        const session = sessionParams || (await this.connection.startSession());

        try {
            if (!sessionParams) {
                session.startTransaction();
            }
            const chat = new this.chatModel(createChatDto);

            if (chat.chatBelong === CHAT_BELONG.FILE_SERVICE) {
                fileService = await this.fileServiceModal.findById(chat.service).session(session);
                if (
                    fileService &&
                    (fileService.status === FILE_SERVICE_STATUS.CLOSED ||
                        fileService.status === FILE_SERVICE_STATUS.COMPLETED)
                ) {
                    await this.fileServiceModal.findByIdAndUpdate(
                        chat.service,
                        { status: FILE_SERVICE_STATUS.OPEN },
                        { session },
                    );
                    fileServiceUniqueId = fileService.uniqueId.toString();
                }
            }

            if (chat.chatBelong === CHAT_BELONG.SUPPORT_TICKET) {
                supportTicket = await this.supportTicketModel
                    .findById(chat.service)
                    .select('status ticketId')
                    .session(session);
                if (supportTicket.status === SUPPORT_STATUS.CLOSED) {
                    await this.supportTicketModel.findByIdAndUpdate(
                        chat.service,
                        { status: SUPPORT_STATUS.OPEN },
                        { session },
                    );
                    ticketUniqueId = supportTicket.ticketId;
                }
            }

            if (file) {
                let uploadedFile = '';
                if (createChatDto.isRequiredEncoding === 'true' && fileService) {
                    encodedFile = await this.encodeModifiedFile(file.path, fileService);
                    filename = basename(encodedFile);
                    originalName = basename(encodedFile);
                    uploadedFile = await this.storageService.upload(createChatDto.service.toString(), {
                        name: filename,
                        path: encodedFile,
                    });
                } else {
                    uploadedFile = await this.storageService.upload(createChatDto.service.toString(), {
                        name: filename,
                        path: file.path,
                    });
                }
                chat.file = {
                    originalname: originalName,
                    uniqueName: filename,
                    key: uploadedFile,
                };
                chat.mimeType = file.mimetype;
                isUploaded = true;
            }
            const newChat = await chat.save({ session });

            console.log('newChat', newChat);

            //catapush notification
            if (fileService || supportTicket) {
                const idNumber = fileService ? fileService.uniqueId : supportTicket.ticketId;
                if (newChat.messageSenderGroup === CHAT_MESSAGE_SENDER_GROUP.CUSTOMER) {
                    const customer = await this.customerModel
                        .findById(createChatDto.customer)
                        .select('email firstName lastName');
                    const message = `New message from "${customer.firstName} ${customer.lastName}" ticket number ${idNumber}`;
                    this.catapushMessageProducer.sendCatapushMessage(createChatDto.admin, message, 'admin');
                } else {
                    const customer = await this.customerModel
                        .findById(createChatDto.customer)
                        .select('email phone firstName lastName countryCode');
                    const message = `New message from for ticket number ${idNumber}`;
                    if (customer.phone) {
                        const phone = customer.countryCode
                            ? customer.countryCode.replace('+', '') + customer.phone
                            : customer.phone;
                        this.catapushMessageProducer.sendCatapushMessage(
                            createChatDto.admin,
                            message,
                            'customer',
                            phone,
                        );
                    }
                }
            }

            if (sessionParams) {
                return newChat;
            }

            if (fileServiceUniqueId) {
                const customer = await this.customerModel
                    .findById(createChatDto.customer)
                    .select('email firstName lastName');
                //send email for re-open file
                this.emailQueueProducers.sendMail({
                    receiver: customer.email,
                    name: customer.firstName + ' ' + customer.lastName,
                    emailType: EMAIL_TYPE.reopenSupportTicket,
                    uniqueId: fileServiceUniqueId,
                });
            }

            if (ticketUniqueId) {
                const customer = await this.customerModel
                    .findById(createChatDto.customer)
                    .select('email firstName lastName');
                //send email for re-open file
                this.emailQueueProducers.sendMail({
                    receiver: customer.email,
                    name: customer.firstName + ' ' + customer.lastName,
                    emailType: EMAIL_TYPE.reopenFileService,
                    uniqueId: fileServiceUniqueId,
                });
            }

            await session.commitTransaction();
            return newChat;
        } catch (error) {
            if (!sessionParams) {
                await session.abortTransaction();
            }

            if (isUploaded) {
                await this.storageService.delete(createChatDto.service.toString(), filename);
            }
            throw error;
        } finally {
            if (file && existsSync(file.path)) {
                unlinkSync(file.path);
            }
            if (encodedFile && existsSync(encodedFile)) {
                unlinkSync(encodedFile);
            }
            if (!sessionParams) {
                await session.endSession();
            }
        }
    }

    async findByFileService(id: Types.ObjectId) {
        const data = await this.chatModel
            .find({ service: id, chatBelong: CHAT_BELONG.FILE_SERVICE })
            .populate({
                path: collectionsName.customer,
                select: 'name',
                strictPopulate: false,
            })
            .lean<Chat[]>();
        return data;
    }
    async findBySupportId(id: Types.ObjectId) {
        const data = await this.chatModel
            .find({ service: id, chatBelong: CHAT_BELONG.SUPPORT_TICKET })
            .populate({
                path: collectionsName.customer,
                select: 'name',
                strictPopulate: false,
            })
            .lean<Chat[]>();
        return data;
    }

    async remove(id: Types.ObjectId) {
        const data = await this.chatModel.findByIdAndDelete(id).lean<Chat>();
        if (data.file) await this.storageService.delete(data.service.toString(), data.file.key);
        return data;
    }

    async deleteManyByFileServiceId(id: Types.ObjectId, session?: ClientSession) {
        const data = await this.chatModel
            .deleteMany({ service: id, chatBelong: CHAT_BELONG.FILE_SERVICE }, { session })
            .lean<Chat[]>();
        return data;
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
        }
    }
}
