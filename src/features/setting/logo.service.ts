import * as fs from 'fs';
import * as path from 'path';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Logo } from './schema/logo.schema';
import { collectionsName } from '../constant';
import { Admin, AdminDocument } from '../admin/schema/admin.schema';

@Injectable()
export class LogoService {
    logoPath = path.join(process.cwd(), 'public', 'images');
    constructor(
        @InjectModel(collectionsName.logo) private readonly logoModel: Model<Logo>,
        @InjectModel(collectionsName.admin) private readonly adminModel: Model<Admin>,
    ) {}

    async uploadLogo(adminId: Types.ObjectId, logoType: string, file: Express.Multer.File) {
        if (!file) throw new BadRequestException('Logo is required');

        const admin = await this.adminModel.findById(adminId).select('domains').lean<AdminDocument>();
        const existingLogo = await this.logoModel.findOne({ admin: adminId });

        if (existingLogo && existingLogo[logoType]) {
            const imagePath = path.join(this.logoPath, existingLogo[logoType]);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }
        const logo = this.logoModel.findOneAndUpdate(
            { admin: adminId },
            { $set: { admin: adminId, domains: admin.domains, [logoType]: file.filename } },
            { upsert: true, new: true },
        );
        return logo;
    }

    async getLogo(domain: string) {
        return this.logoModel
            .findOne({ domains: { $in: [domain] } })
            .select('logoLight logoDark invoiceLogo logoIconLight logoIconDark')
            .lean<Logo>();
    }
}
