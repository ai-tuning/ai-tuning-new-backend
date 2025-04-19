import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

@Schema({ versionKey: false, timestamps: true })
export class Logo {
    @Prop({ type: mongoose.Schema.Types.ObjectId })
    admin: Types.ObjectId;

    @Prop({ type: [String], required: true })
    domains: string[];

    @Prop({ type: String })
    logoDark: string;

    @Prop({ type: String })
    logoLight: string;

    @Prop({ type: String })
    logoIconDark: string;

    @Prop({ type: String })
    logoIconLight: string;

    @Prop({ type: String })
    invoiceLogo: string;

    @Prop({ type: String })
    authBackground: string;
}

export const LogoSchema = SchemaFactory.createForClass(Logo);
