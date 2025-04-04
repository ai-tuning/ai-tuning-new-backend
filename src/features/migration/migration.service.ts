import { Injectable } from '@nestjs/common';
import { Pool, createPool } from 'mysql2/promise';
import { collectionsName, UserStatusEnum } from '../constant';
import { Model, Types } from 'mongoose';
import { CustomerService } from '../customer/customer.service';
import { InjectModel } from '@nestjs/mongoose';
import { Customer } from '../customer/schema/customer.schema';
import { InvoiceService } from '../invoice/invoice.service';
import { Invoice } from '../invoice/schema/invoice.schema';
import { Car } from '../car/schema/car.schema';
import { CarController } from '../car-controller/schema/car-controller.schema';
import { PathService } from '../common';

import { Solution } from '../solution/schema/solution.schema';
import { CustomerType } from '../customer/schema/customer-type.schema';
import { User } from '../user/schema/user.schema';
import { Admin } from '../admin/schema/admin.schema';
import { FileService } from '../file-service/schema/file-service.schema';
import { Pricing } from '../pricing/schema/pricing.schema';
import * as bcrypt from 'bcrypt';
import * as csv from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';
import { CreateCustomerDto } from '../customer/dto/create-customer.dto';
import { SolutionInformation } from '../solution/schema/solution-information.schema';

@Injectable()
export class MigrationService {
    connection: Pool;

    constructor(
        private readonly customerService: CustomerService,
        private readonly invoiceService: InvoiceService,
        @InjectModel(collectionsName.customer) private readonly customerModel: Model<Customer>,
        @InjectModel(collectionsName.invoice) private readonly invoiceModel: Model<Invoice>,
        @InjectModel(collectionsName.car) private readonly carModel: Model<Car>,
        @InjectModel(collectionsName.controller) private readonly carControllerModel: Model<CarController>,
        @InjectModel(collectionsName.solution) private readonly solutionModel: Model<Solution>,
        @InjectModel(collectionsName.customerType) private readonly customerTypeModel: Model<CustomerType>,
        @InjectModel(collectionsName.user) private readonly userModel: Model<User>,
        @InjectModel(collectionsName.fileService) private readonly fileServiceModel: Model<FileService>,
        @InjectModel(collectionsName.admin) private readonly adminModel: Model<Admin>,
        @InjectModel(collectionsName.pricing) private readonly pricingModel: Model<Pricing>,
        @InjectModel(collectionsName.solutionInformation)
        private readonly solutionInformation: Model<SolutionInformation>,
        private readonly pathService: PathService,
    ) {
        //configure mysql
        this.connection = createPool({
            host: process.env.MYSQL_ADDON_HOST,
            user: process.env.MYSQL_ADDON_USER,
            password: process.env.MYSQL_ADDON_PASSWORD,
            database: process.env.MYSQL_ADDON_DB,
            port: Number(process.env.MYSQL_ADDON_PORT),
            waitForConnections: true,
            connectionLimit: 10,
            maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
            idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
            connectTimeout: 60000,
        });
    }

    async migrate() {
        // return this.insertCsvUserData();
        //create cars
        // await this.manualCarCreation();
        //create solutions
        // await this.migrateSolution();
        // const [dealers] = (await this.connection.query('SELECT * FROM dealers')) as any[];
        // const customerPayload: CreateCustomerDto[] = [];
        // const existingCustomers = await this.customerModel.find();
        // const existingInvoices = await this.invoiceModel.find().lean();
        // for (const dealer of dealers) {
        //   const countryInfo = countriesObject[dealer.location];
        //   const findExiting = existingCustomers.find((c) => {
        //     // console.log('c.email', c.email);
        //     // console.log('dealer.email', dealer.email);
        //     return c.email === dealer.email;
        //   });
        //   if (findExiting) {
        //     console.log('Skipped', findExiting.email, dealer.email);
        //     continue;
        //   }
        //   console.log('Processing', dealer.email);
        //   if (dealer.email) {
        //     if (dealer.email === 'tom.muellner78@gmail.com' || dealer.email === 'ibrhmylmzz@gmail.com') {
        //       continue;
        //     }
        //     const customerObj: CreateCustomerDto = {
        //       admin: new Types.ObjectId(process.env.SUPER_ADMIN_ID),
        //       email: dealer.email,
        //       password: dealer.password || 'test1234',
        //       firstName: dealer.firstname || 'demo firstname',
        //       lastName: dealer.lastname || 'demo lastname',
        //       phone: dealer.phone || '1234567890',
        //       address: dealer.address || 'demo address',
        //       city: dealer.city || 'demo city',
        //       country: dealer.location || 'demo country',
        //       postcode: dealer.postcode || '1234',
        //       credits: dealer.credits,
        //       evcNumber: dealer.evcNumber,
        //       companyName: dealer.companyName || 'demo company',
        //       countryCode: countryInfo?.phone,
        //       status: UserStatusEnum.ACTIVE,
        //       customerType: new Types.ObjectId('67cf736cb8ec335bfd70b222'),
        //       street: dealer.street,
        //       mysqlId: dealer.Id,
        //     };
        //     if (dealer.type === 'Special') {
        //       customerObj.customerType = new Types.ObjectId('67cf7830315b5dc3f2d4e568');
        //     } else if (dealer.type === 'Premium') {
        //       customerObj.customerType = new Types.ObjectId('67cf7820315b5dc3f2d4e558');
        //     } else if (dealer.type === 'Custom') {
        //       customerObj.customerType = new Types.ObjectId('67cf7827315b5dc3f2d4e560');
        //     }
        //     await this.customerService.create(customerObj);
        //   }
        // }
        // Wait for all customer creation promises to resolve
        // const [invoices] = (await this.connection.query('SELECT * FROM invoice')) as any[];
        // const [invoiceDetails] = (await this.connection.query('SELECT * FROM invoicedetails')) as any[];
        // const customer = await this.customerModel.find({}).exec();
        // const invoicePayload: CreateInvoiceDto[] = invoices
        //   .map((invoice) => {
        //     const findInvoiceDetails = invoiceDetails.find((detail) => detail.invoiceId === invoice.Id);
        //     const customerInfo = customer.find((c) => c.mysqlId == invoice.dealerId);
        //     if (!customerInfo) {
        //       return null;
        //     }
        //     const existingInvoice = existingInvoices.find((c) => c.mysqlId == invoice.Id);
        //     if (existingInvoice) {
        //       console.log('Invoice skipped', existingInvoice.mysqlId);
        //       return null;
        //     }
        //     console.log('invoice inserted');
        //     return {
        //       admin: new Types.ObjectId(process.env.SUPER_ADMIN_ID),
        //       customer: customerInfo._id as Types.ObjectId,
        //       invoiceNumber: invoice.invoiceNumber,
        //       description: findInvoiceDetails.description,
        //       grandTotal: invoice.grandTotal,
        //       isEvcCredit: invoice.productType === 'evc',
        //       quantity: findInvoiceDetails.quantity,
        //       unitPrice: findInvoiceDetails.unitPrice,
        //       reverseCharge: false,
        //       vat: 0,
        //       totalPrice: findInvoiceDetails.totalPrice,
        //       createdAt: new Date(invoice.createdAt),
        //       updatedAt: new Date(invoice.updatedAt),
        //       mysqlId: invoice.Id,
        //     };
        //   })
        //   .filter(Boolean);
        // const createdInvoice = await this.invoiceModel.create(invoicePayload);
        // console.log('invoicePayload', invoicePayload);
        // return createdInvoice;
        // return 'Migration completed'
        //fix pricing
        // const admins = await this.adminModel.find();
        // const customerTypes = await this.customerTypeModel.find();
        // const solutions = await this.solutionModel.find();
        // for (const admin of admins) {
        //   const adminCustomerTypes = customerTypes.filter((ct) => ct.admin.toString() == admin._id.toString());
        //   const pricing = new this.pricingModel({
        //     admin: admin._id,
        //     enabledPricingType: 'SOLUTION_BASED',
        //   });
        //   for (const adminCustomerType of adminCustomerTypes) {
        //     pricing.items.push(
        //       ...[
        //         {
        //           customerType: adminCustomerType._id as Types.ObjectId,
        //           price: 0,
        //           solutionCategory: SOLUTION_CATEGORY.DEACTIVATION,
        //           makeType: MAKE_TYPE_ENUM.CAR,
        //         },
        //         {
        //           customerType: adminCustomerType._id as Types.ObjectId,
        //           price: 0,
        //           solutionCategory: SOLUTION_CATEGORY.DEACTIVATION,
        //           makeType: MAKE_TYPE_ENUM.BIKE,
        //         },
        //         {
        //           customerType: adminCustomerType._id as Types.ObjectId,
        //           price: 0,
        //           solutionCategory: SOLUTION_CATEGORY.DEACTIVATION,
        //           makeType: MAKE_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
        //         },
        //         {
        //           customerType: adminCustomerType._id as Types.ObjectId,
        //           price: 0,
        //           solutionCategory: SOLUTION_CATEGORY.SPECIALS,
        //           makeType: MAKE_TYPE_ENUM.CAR,
        //         },
        //         {
        //           customerType: adminCustomerType._id as Types.ObjectId,
        //           price: 0,
        //           solutionCategory: SOLUTION_CATEGORY.SPECIALS,
        //           makeType: MAKE_TYPE_ENUM.BIKE,
        //         },
        //         {
        //           customerType: adminCustomerType._id as Types.ObjectId,
        //           price: 0,
        //           solutionCategory: SOLUTION_CATEGORY.SPECIALS,
        //           makeType: MAKE_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
        //         },
        //         {
        //           customerType: adminCustomerType._id as Types.ObjectId,
        //           price: 0,
        //           solutionCategory: SOLUTION_CATEGORY.TUNING,
        //           makeType: MAKE_TYPE_ENUM.CAR,
        //         },
        //         {
        //           customerType: adminCustomerType._id as Types.ObjectId,
        //           price: 0,
        //           solutionCategory: SOLUTION_CATEGORY.TUNING,
        //           makeType: MAKE_TYPE_ENUM.BIKE,
        //         },
        //         {
        //           customerType: adminCustomerType._id as Types.ObjectId,
        //           price: 0,
        //           solutionCategory: SOLUTION_CATEGORY.TUNING,
        //           makeType: MAKE_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
        //         },
        //       ],
        //     );
        //     for (const solution of solutions) {
        //       pricing.solutionItems.push(
        //         ...[
        //           {
        //             customerType: adminCustomerType._id as Types.ObjectId,
        //             price: 0,
        //             makeType: MAKE_TYPE_ENUM.CAR,
        //             solution: solution._id as Types.ObjectId,
        //           },
        //           {
        //             customerType: adminCustomerType._id as Types.ObjectId,
        //             price: 0,
        //             makeType: MAKE_TYPE_ENUM.BIKE,
        //             solution: solution._id as Types.ObjectId,
        //           },
        //           {
        //             customerType: adminCustomerType._id as Types.ObjectId,
        //             price: 0,
        //             makeType: MAKE_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION,
        //             solution: solution._id as Types.ObjectId,
        //           },
        //         ],
        //       );
        //     }
        //   }
        //   const findExitingPricing = await this.pricingModel.findOne({ admin: admin._id });
        //   pricing.priceLimits = findExitingPricing.priceLimits;
        //   pricing.save();
        // }
        // const userUpdatePayload = [];
        // for (const dealer of dealers) {
        //   const customer = existingCustomers.find((customer) => customer.mysqlId == dealer.Id);
        //   if (customer) {
        //     if (dealer.password) {
        //       console.log('dealer.password', dealer.password);
        //       userUpdatePayload.push({
        //         updateOne: {
        //           filter: { _id: customer.user },
        //           update: { $set: { password: dealer.password, isVerified: true } },
        //         },
        //       });
        //     } else {
        //       const saltRounds = 10;
        //       const hashedPassword = await bcrypt.hash('test1234', saltRounds);
        //       console.log('hashedPassword', hashedPassword);
        //       userUpdatePayload.push({
        //         updateOne: {
        //           filter: { _id: customer.user },
        //           update: { $set: { password: hashedPassword, isVerified: true } },
        //         },
        //       });
        //     }
        //   }
        // }
        // await this.userModel.bulkWrite(userUpdatePayload);

        await this.migrateSolutionInformation();

        return 'completed';
    }

    // async manualCarCreation() {
    //   const [cars] = (await this.connection.query('SELECT * FROM cars')) as any[];
    //   const [controllers] = (await this.connection.query('SELECT * FROM controllers')) as any[];

    //   const carsPayload = cars.map((car) => {
    //     if (car.makeType === 'TRUCK-AGRI-CONSTRUCTION') {
    //       car.makeType = 'TRUCK_AGRI_CONSTRUCTION';
    //     }
    //     return { name: car.carname.trim(), makeType: car.makeType, mysqlId: car.Id };
    //   });

    //   await this.carModel.insertMany(carsPayload);
    //   const insertedCars = await this.carModel.find().lean();

    //   insertedCars.forEach(async (car) => {
    //     const carController = controllers.filter((controller) => controller.makeId == car.mysqlId);

    //     const makeControllerPayload = carController.map((controller) => ({
    //       name: controller.controllername.trim(),
    //       car: car._id,
    //       mysqlId: controller.Id,
    //     }));

    //     await this.carControllerModel.insertMany(makeControllerPayload);
    //   });
    // }

    // async migrateSolution() {
    //   const [solutions] = (await this.connection.query('SELECT * FROM solutions')) as any[];
    //   console.log(solutions);
    //   const solutionPayload = [];
    //   for (const solution of solutions) {
    //     let category = solution.category;
    //     if (solution.category === 'Miscle') {
    //       category = 'SPECIAL';
    //     }
    //     solutionPayload.push({
    //       name: solution.solutionname,
    //       category: category.toUpperCase(),
    //       fuelTypes: solution.fuelOptions.toUpperCase().split(','),
    //       mysqlId: solution.Id,
    //       makeTypes: [MAKE_TYPE_ENUM.CAR, MAKE_TYPE_ENUM.BIKE, MAKE_TYPE_ENUM.TRUCK_AGRI_CONSTRUCTION],
    //     });
    //     console.log(solutionPayload);
    //   }
    //   await this.solutionModel.insertMany(solutionPayload);
    // }

    async insertCsvUserData() {
        const csvPath = path.join(process.cwd(), 'kunder.csv');
        //create read stream of the csv file
        const results = [];
        const customers = await this.customerModel.find();
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => {
                const obj = {};
                for (const key in data) {
                    let cleanedKey = key.replace(/\t/g, ''); //remove tabs
                    if (cleanedKey.charCodeAt(0) === 0xfeff) {
                        // Check for BOM
                        cleanedKey = cleanedKey.slice(1); // Remove BOM
                    }
                    obj[cleanedKey.toLowerCase()] = data[key];
                }
                results.push(obj);
            })
            .on('end', async () => {
                for (const customer of results) {
                    const [firstName, ...lastNameArr] = customer.name.split(' ');
                    const lastName = lastNameArr.join(' ');

                    const findExisting = customers.find((item) => item.email === customer.email);
                    if (findExisting) {
                        if (findExisting.admin.toString() !== '67d2f76b05303a1adbdad2dd') {
                            console.log(customer.email, findExisting.admin);
                        }
                        continue;
                    }

                    const customerObj: CreateCustomerDto = {
                        admin: new Types.ObjectId('67d2f76b05303a1adbdad2dd'),
                        email: customer.email,
                        password: customer.password || '123456',
                        firstName,
                        lastName,
                        phone: '1234567890',
                        address: 'demo address',
                        city: 'demo city',
                        country: 'demo country',
                        postcode: '1234',
                        credits: 0,
                        companyName: customer.company || 'demo company',
                        countryCode: 'NO',
                        status: UserStatusEnum.ACTIVE,
                        customerType: new Types.ObjectId('67d2f76b05303a1adbdad2e6'),
                        street: 'demo streen',
                    };
                    // console.log(customerObj);
                    await this.customerService.create(customerObj);
                    console.log('customer created===>', customerObj.email);
                }
            });
    }

    async migrateSolutionInformation() {
        const [solutionInformation] = (await this.connection.query('SELECT * from solution_information')) as any;
        const payload = [];

        const controllers = await this.carControllerModel.find();
        const solutions = await this.solutionModel.find();

        for (const item of solutionInformation) {
            if (item.information) {
                const controller = controllers.find((c) => {
                    if (c.mysqlId) {
                        return c.mysqlId.toString() === item.controllerId.toString();
                    }
                });
                const solution = solutions.find((c) => {
                    if (c.mysqlId) {
                        return c.mysqlId.toString() === item.solutionId.toString();
                    }
                });

                if (controller && solution) {
                    const content = item.information.trim();
                    if (content) {
                        payload.push({
                            solution: solution._id,
                            controller: controller._id,
                            content,
                            mysqlId: item.Id,
                        });
                    } else {
                        console.log(content);
                    }
                } else {
                    // console.log(item);
                }
            }
        }
        console.log(payload);
        await this.solutionInformation.create(payload);
    }
}
