import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { FileSchema } from 'src/features/common';
import { FileModel } from 'src/features/common/schema/file.schema';
import { collectionsName, SUPPORT_STATUS, SUPPORT_TYPE } from 'src/features/constant';

@Schema({ timestamps: true, versionKey: false })
export class SupportTicket extends mongoose.Document {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    admin: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: collectionsName.customer })
    customer: Types.ObjectId;

    //who resolve the ticket
    @Prop({ type: mongoose.Schema.Types.ObjectId })
    operator: Types.ObjectId;

    @Prop({ type: String, required: true })
    ticketId: string;

    @Prop({ type: String, enum: SUPPORT_TYPE, required: true })
    supportType: SUPPORT_TYPE;

    @Prop({ type: String })
    comment: string;

    @Prop({ type: FileSchema })
    file: FileModel;

    @Prop({ type: String, default: SUPPORT_STATUS.OPEN, required: true })
    status: SUPPORT_STATUS;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
