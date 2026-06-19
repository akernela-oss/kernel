import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { seedCore, seedDemo } from './seed.runner';

/**
 * On first boot, ensures the essentials exist (login users, settings, KPI
 * templates) so the app is immediately usable. Sample business data is loaded
 * only when SEED_DEMO=true — by default the system starts empty for real use.
 * Disable all auto-seeding with AUTO_SEED=false.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.get<boolean>('autoSeed')) return;

    const hadUsers = (await this.prisma.user.count()) > 0;
    await seedCore(this.prisma);
    if (!hadUsers) {
      this.logger.log('Initialised core data (users, settings, KPI templates).');
    }

    if (this.config.get<boolean>('seedDemo')) {
      await seedDemo(this.prisma);
      this.logger.log('Demo business data ensured (SEED_DEMO=true).');
    }
  }
}
