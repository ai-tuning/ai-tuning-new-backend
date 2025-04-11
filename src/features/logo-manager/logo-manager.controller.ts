import { Controller } from '@nestjs/common';
import { LogoManagerService } from './logo-manager.service';

@Controller('logo-manager')
export class LogoManagerController {
  constructor(private readonly logoManagerService: LogoManagerService) {}
}
