/**
 * Fail fast on misconfiguration: validate required environment variables at
 * boot so the process never starts in a broken state.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const required = ['DATABASE_URL'];
  const missing = required.filter((key) => !config[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const isProd = (config.NODE_ENV ?? 'development') === 'production';
  if (isProd) {
    const weak = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].filter((key) => {
      const value = config[key];
      return !value || String(value).length < 24 || String(value).startsWith('change_me');
    });
    if (weak.length) {
      throw new Error(
        `Insecure JWT secrets in production: ${weak.join(', ')}. Set long, random values.`,
      );
    }
  }

  return config;
}
