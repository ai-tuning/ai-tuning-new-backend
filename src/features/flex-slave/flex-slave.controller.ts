import { Controller } from '@nestjs/common';
import { FlexSlaveService } from './flex-slave.service';

@Controller('flex-slave')
export class FlexSlaveController {
  constructor(private readonly flexSlaveService: FlexSlaveService) {}
}
