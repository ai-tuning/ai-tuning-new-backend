import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

export class Timing {
  @Prop({ type: String, required: true, default: '00:00:00' })
  from: string;
  @Prop({ type: String, required: true, default: '00:00:00' })
  to: string;
  @Prop({ type: Boolean, required: true, default: false })
  closed: boolean;
}

const defaultTiming = { from: '00:00:00', to: '00:00:00', closed: false };

@Schema({ timestamps: true, versionKey: false })
export class Schedule {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  admin: Types.ObjectId;

  @Prop({ type: Timing, required: true, default: defaultTiming })
  sunday: Timing;

  @Prop({ type: Timing, required: true, default: defaultTiming })
  monday: Timing;

  @Prop({ type: Timing, required: true, default: defaultTiming })
  tuesday: Timing;

  @Prop({ type: Timing, required: true, default: defaultTiming })
  wednesday: Timing;

  @Prop({ type: Timing, required: true, default: defaultTiming })
  thursday: Timing;

  @Prop({ type: Timing, required: true, default: defaultTiming })
  friday: Timing;

  @Prop({ type: Timing, required: true, default: defaultTiming })
  saturday: Timing;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);

export class ScheduleDocument {
  _id: Types.ObjectId;
  admin: Types.ObjectId;
  sunday: Timing;
  monday: Timing;
  tuesday: Timing;
  wednesday: Timing;
  thursday: Timing;
  friday: Timing;
  saturday: Timing;
}
