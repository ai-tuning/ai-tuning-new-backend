import { Prop } from '@nestjs/mongoose';

export class FileSchema {
  @Prop({ type: String, required: true })
  originalname: string;

  @Prop({ type: String, required: true })
  uniqueName: string;

  @Prop({ type: String, required: true })
  key: string;

  @Prop({ type: String })
  publicUrl?: string;
}
