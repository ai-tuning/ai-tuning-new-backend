import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { EvcService } from './evc.service';

import { Types } from 'mongoose';

@Controller('evc')
export class EvcController {
    constructor(private readonly evcService: EvcService) {}

    @Get('check-balance')
    async checkBalance(@Query() query: { adminId: string; evcNumber: string }) {
        const data = await this.evcService.checkEvcBalance(new Types.ObjectId(query.adminId), query.evcNumber);
        let result = {
            status: false,
            balance: 0,
        };
        if (data) {
            const [status, balance] = data.split(' ');
            if (status === 'ok:') {
                result = {
                    status: true,
                    balance,
                };
            }
        }

        return result;
    }
}
