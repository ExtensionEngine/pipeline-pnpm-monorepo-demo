import { registerAs } from '@nestjs/config';
import { dash } from 'radash';
import { z } from 'zod';
import { join } from 'node:path';
import { LoadStrategy, defineConfig } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

const databaseSchema = z.object({
  port: z.coerce.number().default(5432),
  host: z.string(),
  dbName: z.string(),
  user: z.string(),
  password: z.string(),
});

export default registerAs('database', () => {
  const config = databaseSchema.parse({
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    dbName: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  return defineConfig({
    ...config,
    driver: PostgreSqlDriver,
    loadStrategy: LoadStrategy.JOINED,
    debug: process.env.NODE_ENV !== 'production',
    migrations: {
      path: join(process.cwd(), 'dist/shared/database/migrations'),
      pathTs: join(process.cwd(), 'src/shared/database/migrations'),
      glob: '!(*.d).{js,ts}',
      fileName: (timestamp: string) => `${timestamp}-new-migration`,
    },
    seeder: {
      path: `${process.cwd()}/dist/shared/database/seeds`,
      pathTs: `${process.cwd()}/src/shared/database/seeds`,
      fileName: (className: string) => dash(className),
    },
  });
});
