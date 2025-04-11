import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Logo } from './schema/logo.schema';
import { Model, Types } from 'mongoose';
import { collectionsName } from '../constant';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class LogoService {
    logoPath = path.join(process.cwd(), 'public', 'images');
    constructor(@InjectModel(collectionsName.logo) private readonly logoModel: Model<Logo>) {}

    async uploadLightLogo(adminId: Types.ObjectId, origin: string, file: Express.Multer.File) {
        if (!file) throw new BadRequestException('Logo is required');
        const existingLogo = await this.logoModel.findOne({ admin: adminId, domain: origin });
        if (existingLogo.logoLight) {
            const imagePath = path.join(this.logoPath, existingLogo.logoLight);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }
        const logo = this.logoModel.findOneAndUpdate(
            { admin: adminId },
            { $set: { admin: adminId, domain: origin, logoLight: file.filename } },
            { upsert: true, new: true },
        );
        return logo;
    }

    async uploadDarkLogo(adminId: Types.ObjectId, origin: string, file: Express.Multer.File) {
        if (!file) throw new BadRequestException('Logo is required');
        const existingLogo = await this.logoModel.findOne({ admin: adminId, domain: origin });
        if (existingLogo.logoDark) {
            const imagePath = path.join(this.logoPath, existingLogo.logoDark);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }
        const logo = this.logoModel.findOneAndUpdate(
            { admin: adminId },
            { $set: { admin: adminId, domain: origin, logoDark: file.filename } },
            { upsert: true, new: true },
        );
        return logo;
    }

    async uploadInvoiceLogo(adminId: Types.ObjectId, origin: string, file: Express.Multer.File) {
        if (!file) throw new BadRequestException('Logo is required');
        const existingLogo = await this.logoModel.findOne({ admin: adminId, domain: origin });
        if (existingLogo.invoiceLogo) {
            const imagePath = path.join(this.logoPath, existingLogo.invoiceLogo);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }
        const logo = this.logoModel.findOneAndUpdate(
            { admin: adminId },
            { $set: { admin: adminId, domain: origin, invoiceLogo: file.filename } },
            { upsert: true, new: true },
        );
        return logo;
    }
}
