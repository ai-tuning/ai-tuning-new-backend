import { Prop, Schema } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export class PaypalCredential {
  @Prop({ type: String, required: true })
  clientId: string;
  @Prop({ type: String, required: true })
  clientSecret: string;
}

export class AlienTechCredential {
  @Prop({ type: String, required: true })
  clientId: string;
  @Prop({ type: String, required: true })
  clientSecret: string;
}

export class AutoTunerCredential {
  @Prop({ type: String, required: true })
  apiKey: string;
  @Prop({ type: String, required: true })
  tunerId: string;
}

export class EvcCredential {
  @Prop({ type: String, required: true })
  apiId: string;
  @Prop({ type: String, required: true })
  username: string;
  @Prop({ type: String, required: true })
  password: string;
}

@Schema({ timestamps: true, versionKey: false })
export class Credential extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({ type: PaypalCredential })
  paypal: PaypalCredential;

  @Prop({ type: AlienTechCredential })
  alienTech: AlienTechCredential;

  @Prop({ type: EvcCredential })
  evc: EvcCredential;

  @Prop({ type: AutoTunerCredential })
  autoTuner: AutoTunerCredential;

  @Prop({ type: String })
  autoFlasher: string;
}
