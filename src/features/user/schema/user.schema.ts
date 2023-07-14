import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { RolesEnum, UserStatusEnum } from 'src/features/constant';
import { collectionsName } from 'src/features/constant/collectionNames';
import * as bcrypt from "bcrypt"


@Schema({ versionKey: false, timestamps: true })
export class User extends Document {
    @Prop({ type: String, })
    email: string;

    @Prop({ type: String, })
    mobile: string;

    @Prop({ type: String, required: true })
    password: string;

    @Prop({ type: String, enum: RolesEnum, required: true, default: RolesEnum.USER })
    role: RolesEnum;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: collectionsName.admin })
    admin: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: collectionsName.hod })
    hod: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: collectionsName.employee })
    employee: Types.ObjectId;

    @Prop({ type: String, enum: UserStatusEnum, default: UserStatusEnum.ACTIVE })
    status: UserStatusEnum
}

const UserSchema = SchemaFactory.createForClass(User);


UserSchema.pre<User>('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(this.password, saltRounds);
    this.password = hashedPassword;
    next();
});

export { UserSchema }