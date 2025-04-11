import { Module } from '@nestjs/common';
import { LogoManagerService } from './logo-manager.service';
import { LogoManagerController } from './logo-manager.controller';

@Module({
  controllers: [LogoManagerController],
  providers: [LogoManagerService],
})
export class LogoManagerModule {}
