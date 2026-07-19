import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
});

const config = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: config.get<string>('DB_HOST'),
  port: config.get<number>('DB_PORT', 5432),
  username: config.get<string>('DB_USERNAME'),
  password: config.get<string>('DB_PASSWORD'),
  database: config.get<string>('DB_NAME'),
  synchronize: false,
  logging: config.get<boolean>('DB_LOGGING', false),

  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],

  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
};

export default new DataSource(dataSourceOptions);
