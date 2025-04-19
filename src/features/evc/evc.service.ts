import { BadRequestException, Injectable } from '@nestjs/common';
import { CredentialService } from '../credential/credential.service';
import { HttpService } from '@nestjs/axios';
import { Types } from 'mongoose';

@Injectable()
export class EvcService {
    constructor(
        private readonly httpService: HttpService,
        private readonly credentialService: CredentialService,
    ) {}

    async checkEveCustomer(adminId: Types.ObjectId, evcNumber: string) {
        const credential = await this.credentialService.findByAdmin(adminId, 'evc');
        if (!credential) throw new BadRequestException("Your admin doesn't have EVC service.");
        const { evc } = credential;
        const response = await this.httpService.axiosRef.get('', {
            params: {
                ...evc,
                verb: 'checkevccustomer',
                customer: evcNumber,
            },
        });
        return response.data;
    }

    async isInvalidNumber(adminId: Types.ObjectId, evcNumber: string) {
        const data = await this.checkEveCustomer(adminId, evcNumber);
        return data.split(' ')[0] === 'fail:';
    }

    async addCustomer(adminId: Types.ObjectId, evcNumber: string) {
        const credential = await this.credentialService.findByAdmin(adminId, 'evc');
        const { evc } = credential;
        const response = await this.httpService.axiosRef.get('', {
            params: {
                ...evc,
                verb: 'addcustomer',
                customer: evcNumber,
            },
        });
        return response.data;
    }

    async checkEvcBalance(adminId: Types.ObjectId, evcNumber: string) {
        const credential = await this.credentialService.findByAdmin(adminId, 'evc');
        if (!credential || !credential.evc) return null;
        const response = await this.httpService.axiosRef.get('', {
            params: {
                ...credential.evc,
                verb: 'getcustomeraccount',
                customer: evcNumber,
            },
        });
        return response.data;
    }

    async addEvcBalance(adminId: Types.ObjectId, evcNumber: string, credits: number) {
        const credential = await this.credentialService.findByAdmin(adminId, 'evc');
        const response = await this.httpService.axiosRef.get('', {
            params: {
                ...credential.evc,
                verb: 'addcustomeraccount',
                customer: evcNumber,
                credits: credits,
            },
        });
        return response.data;
    }

    remove(id: number) {
        return `This action removes a #${id} evc`;
    }
}
