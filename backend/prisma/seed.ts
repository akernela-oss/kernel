/**
 * Standalone seed script (resets + loads the demo dataset).
 * Run with: `npm run prisma:seed`
 *
 * In Docker the database is also auto-seeded on first boot (see SeedService),
 * so this script is mainly for local development / re-seeding.
 */
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../src/seed/seed.runner';

const prisma = new PrismaClient();

seedDatabase(prisma, { reset: true })
  .then(async (counts) => {
    // eslint-disable-next-line no-console
    console.log('Seed complete:', counts);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
