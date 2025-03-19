import { Controller, Get } from '@nestjs/common';
import { MigrationService } from './migration.service';
import { Public } from '../common';

@Controller('migration')
export class MigrationController {
    constructor(private readonly migrationService: MigrationService) {}

    @Public()
    @Get()
    async migrate() {
        return await this.migrationService.migrate();
    }
}
