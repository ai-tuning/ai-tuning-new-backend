import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class SolutionInformation {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    solution: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    controller: Types.ObjectId;

    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: Number })
    mysqlId: number;
}

export const SolutionInformationSchema = SchemaFactory.createForClass(SolutionInformation);
