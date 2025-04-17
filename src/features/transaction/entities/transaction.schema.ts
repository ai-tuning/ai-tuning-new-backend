import mongoose, { Types } from 'mongoose';
import { collectionsName, TRANSACTION_TYPE } from 'src/features/constant';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
class Transaction {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: collectionsName.admin })
    admin: Types.ObjectId;

    //if customer id exist then it is a customer transaction otherwise it is a admin transaction
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: collectionsName.customer })
    customer: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    service: Types.ObjectId;

    @Prop({ type: Number, required: true })
    amount: number;

    @Prop({ type: String, required: true })
    description: string;

    @Prop({ type: Number, required: true })
    currentAmount: number;

    @Prop({ type: Number, required: true })
    previousAmount: number;

    @Prop({ type: String, required: true, enum: TRANSACTION_TYPE })
    transactionType: TRANSACTION_TYPE;
}

const transactionSchema = SchemaFactory.createForClass(Transaction);

export { transactionSchema, Transaction };
