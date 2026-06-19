/** Strongly-typed application configuration, loaded once from the environment. */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  bcryptRounds: number;
  throttle: {
    ttlMs: number;
    limit: number;
  };
  logLevel: string;
  autoSeed: boolean;
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigins: (process.env.CORS_ORIGINS ?? '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'insecure-dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'insecure-dev-refresh-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '900s',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '10', 10),
  throttle: {
    ttlMs: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '300', 10),
  },
  logLevel: process.env.LOG_LEVEL ?? 'info',
  autoSeed: (process.env.AUTO_SEED ?? 'true').toLowerCase() !== 'false',
});
