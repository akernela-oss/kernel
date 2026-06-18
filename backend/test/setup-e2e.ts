import { config } from 'dotenv';
import { join } from 'path';

// Load the test environment (points DATABASE_URL at the presale_test database).
config({ path: join(__dirname, '..', '.env.test') });
