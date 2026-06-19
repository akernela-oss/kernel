import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { seedDatabase } from './seed.runner';

/**
 * Seeds the demo dataset automatically on first boot when the database is
 * empty. Runs as compiled JS inside the app (no ts-node), so `docker compose
 * up` yields a ready-to-use database with the demo users — no manual step.
 * Disable with AUTO_SEED=false.
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
    const users = await this.prisma.user.count();
    if (users > 0) return;
    this.logger.log('Empty database detected — seeding demo data...');
    const counts = await seedDatabase(this.prisma, { reset: false });
    this.logger.log(`Seed complete: ${JSON.stringify(counts)}`);
  }
}
