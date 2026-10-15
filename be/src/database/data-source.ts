import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

void ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
});

const config = new ConfigService();

// Strip surrounding quotes: `neon deploy` writes quoted values into .env.local,
// and a verbatim copy into be/.env would otherwise break pg connection parsing.
const stripQuotes = (v: string | undefined): string | undefined =>
  v?.trim().replace(/^["']|["']$/g, '');

const rawMigrationDbUrl =
  config.get<string>('DATABASE_URL_UNPOOLED') ||
  config.get<string>('DATABASE_URL');

// Neon: use direct (unpooled) URL for migrations per neon-postgres skill.
// Falls back to pooled DATABASE_URL, then to discrete DB_HOST* vars (localhost dev).
const migrationDbUrl = stripQuotes(rawMigrationDbUrl);

const discreteDbConfig = {
  host: config.get<string>('DB_HOST'),
  port: config.get<number>('DB_PORT', 5432),
  username: config.get<string>('DB_USERNAME'),
  password: config.get<string>('DB_PASSWORD'),
  database: config.get<string>('DB_NAME'),
};

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  ...(migrationDbUrl
    ? {
        url: migrationDbUrl,
        // Neon requires SSL; pooler + direct endpoints use public certs.
        ssl: { rejectUnauthorized: false },
      }
    : discreteDbConfig),
  synchronize: false,
  logging: config.get<boolean>('DB_LOGGING', false),

  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],

  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
};

export default new DataSource(dataSourceOptions);
