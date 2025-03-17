import { Controller } from '@nestjs/common';
import { CatapushService } from './catapush.service';

@Controller('catapush')
export class CatapushController {
  constructor(private readonly catapushService: CatapushService) {}
}
