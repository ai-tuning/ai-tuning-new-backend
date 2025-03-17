import { Module } from '@nestjs/common';
import { CatapushService } from './catapush.service';
import { CatapushController } from './catapush.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://api.catapush.com',
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  ],
  controllers: [CatapushController],
  providers: [CatapushService],
  exports: [CatapushService],
})
export class CatapushModule {}
