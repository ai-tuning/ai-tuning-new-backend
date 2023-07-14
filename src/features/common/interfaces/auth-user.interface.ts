import { Types } from "mongoose";

export interface IAuthUser {
    _id: Types.ObjectId,
    admin: Types.ObjectId
}