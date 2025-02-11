import { Prop } from '@nestjs/mongoose';

export class Kess3 {
  @Prop({ type: String, required: true })
  mode: string;

  @Prop({ type: String, required: true })
  fileType: string;

  @Prop({ type: String, required: true })
  fileSlotGUID: string;

  @Prop({ type: Boolean, required: true })
  isCVNCorrectionPossible: boolean;
}

export class AutoTuner {
  @Prop({ type: String, required: true })
  mode: string;

  @Prop({ type: String, required: true })
  ecu_id: string;

  @Prop({ type: String, required: true })
  mcu_id: string;

  @Prop({ type: String, required: true })
  model_id: string;

  @Prop({ type: String, required: true })
  slave_id: string;
}

export class AutoFlasher {
  @Prop({ type: String, required: true })
  serialNumber: string;

  @Prop({ type: String, required: true })
  memory_type: string;
}
