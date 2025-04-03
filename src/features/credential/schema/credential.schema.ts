import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export class PaypalCredential {
    @Prop({ type: String, required: true, default: '' })
    clientId: string;
    @Prop({ type: String, required: true, default: '' })
    clientSecret: string;
}

export class AlienTechCredential {
    @Prop({ type: String, required: true, default: '' })
    clientId: string;
    @Prop({ type: String, required: true, default: '' })
    clientSecret: string;
    @Prop({ type: String })
    accessToken: string;
}

export class AutoTunerCredential {
    @Prop({ type: String, required: true, default: '' })
    apiKey: string;
    @Prop({ type: String, required: true, default: '' })
    tunerId: string;
}

export class AutoFlasherCredential {
    @Prop({ type: String, required: true, default: '' })
    apiKey: string;
}

export class FlexSlaveCredential {
    @Prop({ type: String, required: true, default: '' })
    apiKey: string;
}

export class EvcCredential {
    @Prop({ type: String, required: true, default: '' })
    apiId: string;
    @Prop({ type: String, required: true, default: '' })
    username: string;
    @Prop({ type: String, required: true, default: '' })
    password: string;
}

@Schema({ timestamps: true, versionKey: false })
export class Credential extends Types.ObjectId {
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

    @Prop({ type: AutoFlasherCredential })
    autoFlasher: AutoFlasherCredential;

    @Prop({ type: AutoFlasherCredential })
    flexSlave: AutoFlasherCredential;
}

export const CredentialSchema = SchemaFactory.createForClass(Credential);
