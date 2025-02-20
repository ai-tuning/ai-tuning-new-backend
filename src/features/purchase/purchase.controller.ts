import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, Res } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseCreditDto } from './dto/purchase-credit.dto';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Public } from '../common';
import { PurchaseAdminCreditDto } from './dto/purchase-admin-credit.dto';

@Controller('purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post('credit/generate-link')
  async purchaseCredits(@Body() purchaseCreditDto: PurchaseCreditDto, @Req() request: Request) {
    const origin = request.headers.origin;
    const data = await this.purchaseService.purchaseCredits(
      purchaseCreditDto.admin,
      purchaseCreditDto,
      encodeURIComponent(origin),
    );
    return data;
  }

  @Post('admin-credit/generate-link')
  async purchaseAdminCredits(@Body() purchaseAdminCreditDto: PurchaseAdminCreditDto, @Req() request: Request) {
    const origin = request.headers.origin;
    const data = await this.purchaseService.purchaseAdminCredits(
      purchaseAdminCreditDto.admin,
      purchaseAdminCreditDto,
      encodeURIComponent(origin),
    );
    return data;
  }

  @Public()
  @Get('credit/verify-and-save-credits')
  async saveCredits(
    @Req() request: Request,
    @Res() response: Response,
    @Query() query: { token: string; invoiceId: string; origin: string },
  ) {
    const cookie = request.cookies['ai-tuning-refresh-token'];

    if (!cookie) {
      return response.redirect(`${query.origin}/payment/failed`);
    }

    const data = await this.purchaseService.verifyAndSaveCredits(new Types.ObjectId(query.invoiceId), query.token);
    if (!data) {
      return response.redirect(`${query.origin}/payment/failed`);
    }

    return response.redirect(`${query.origin}/payment/success`);
  }
}
