import { BadRequestException, Injectable } from '@nestjs/common';
import { ClientSession, Model } from 'mongoose';
import { VerificationEmail } from './schema/verification-mail.schema';
import { differenceInMinutes } from 'date-fns';
import { InjectModel } from '@nestjs/mongoose';
import { collectionsName, VerificationEmailEnum } from 'src/features/constant';

@Injectable()
export class VerificationMailService {
  constructor(
    @InjectModel(collectionsName.verificationMail) private readonly verificationEmailModel: Model<VerificationEmail>,
  ) {}

  private generateRandomCode(): string {
    //generate 6 digit random code
    return Math.floor(Math.random() * 1000000).toString();
  }

  async createVerificationEmail(
    email: string,
    verificationType: VerificationEmailEnum,
    session?: ClientSession,
  ): Promise<VerificationEmail> {
    const code = this.generateRandomCode();
    const verificationEmail = new this.verificationEmailModel({
      email,
      verificationType: verificationType,
      code,
      duration: 5,
    });
    if (session) {
      return verificationEmail.save({ session });
    }
    return verificationEmail.save();
  }

  async getVerificationEmail(email: string, verificationType: VerificationEmailEnum): Promise<VerificationEmail> {
    return this.verificationEmailModel.findOne({ email, verificationType });
  }

  async verifyEmail(
    email: string,
    code: string,
    verificationType: VerificationEmailEnum,
    session: ClientSession,
  ): Promise<boolean> {
    const data = await this.verificationEmailModel
      .findOne({ email, code, verificationType, isUsed: false })
      .sort({ createdAt: -1 });
    if (!data) {
      throw new BadRequestException('Invalid verification code');
    }

    const now = new Date();
    const difference = differenceInMinutes(now, data.createdAt);
    if (difference > data.duration) {
      this.verificationEmailModel.deleteMany({ email, code }).exec();
      throw new BadRequestException('Verification code expired');
    }

    data.isUsed = true;

    if (session) {
      await data.save({ session });
    } else {
      await data.save();
    }

    return true;
  }
}
