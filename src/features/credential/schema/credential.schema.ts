import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

@Schema({ versionKey: false, timestamps: false, _id: false })
export class PaypalCredential {
    @Prop({ type: String, required: true, default: '' })
    clientId: string;
    @Prop({ type: String, required: true, default: '' })
    clientSecret: string;
}

@Schema({ versionKey: false, timestamps: false, _id: false })
export class AlienTechCredential {
    @Prop({ type: String, required: true, default: '' })
    clientId: string;
    @Prop({ type: String, required: true, default: '' })
    clientSecret: string;
    @Prop({ type: String })
    accessToken: string;
}

@Schema({ versionKey: false, timestamps: false, _id: false })
export class AutoTunerCredential {
    @Prop({ type: String, required: true, default: '' })
    apiKey: string;
    @Prop({ type: String, required: true, default: '' })
    tunerId: string;
}

@Schema({ versionKey: false, timestamps: false, _id: false })
export class AutoFlasherCredential {
    @Prop({ type: String, required: true, default: '' })
    apiKey: string;
}

@Schema({ versionKey: false, timestamps: false, _id: false })
export class FlexSlaveCredential {
    @Prop({ type: String, required: true, default: '' })
    apiKey: string;
}

@Schema({ versionKey: false, timestamps: false, _id: false })
export class EvcCredential {
    @Prop({ type: String, required: true, default: '' })
    apiId: string;
    @Prop({ type: String, required: true, default: '' })
    username: string;
    @Prop({ type: String, required: true, default: '' })
    password: string;
}

@Schema({ versionKey: false, timestamps: false, _id: false })
export class SMTPCredential {
    @Prop({ type: String, required: true, default: '' })
    host: string;

    @Prop({ type: String, required: true, default: '' })
    port: string;

    @Prop({ type: String, required: true, default: '' })
    username: string;

    @Prop({ type: String, required: true, default: '' })
    password: string;

    @Prop({ type: String, required: true, default: '', lowercase: true })
    from: string;

    @Prop({ type: String, required: true, default: '', lowercase: true })
    support: string;
}

const SMTPCredentialSchema = SchemaFactory.createForClass(SMTPCredential);
const EvcCredentialSchema = SchemaFactory.createForClass(EvcCredential);
const FlexSlaveCredentialSchema = SchemaFactory.createForClass(FlexSlaveCredential);
const PaypalCredentialSchema = SchemaFactory.createForClass(PaypalCredential);
const AlienTechCredentialSchema = SchemaFactory.createForClass(AlienTechCredential);
const AutoTunerCredentialSchema = SchemaFactory.createForClass(AutoTunerCredential);
const AutoFlasherCredentialSchema = SchemaFactory.createForClass(AutoFlasherCredential);

@Schema({ timestamps: true, versionKey: false })
export class Credential extends Types.ObjectId {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    admin: Types.ObjectId;

    @Prop({ type: PaypalCredentialSchema })
    paypal: PaypalCredential;

    @Prop({ type: AlienTechCredentialSchema })
    alienTech: AlienTechCredential;

    @Prop({ type: EvcCredentialSchema })
    evc: EvcCredential;

    @Prop({ type: AutoTunerCredentialSchema })
    autoTuner: AutoTunerCredential;

    @Prop({ type: AutoFlasherCredentialSchema })
    autoFlasher: AutoFlasherCredential;

    @Prop({ type: FlexSlaveCredentialSchema })
    flexSlave: FlexSlaveCredential;

    @Prop({ type: SMTPCredentialSchema })
    smtp: SMTPCredential;
}

export const CredentialSchema = SchemaFactory.createForClass(Credential);
