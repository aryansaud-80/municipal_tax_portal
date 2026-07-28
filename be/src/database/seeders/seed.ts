import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { DatabaseSeeder } from './database.seeder';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(SeederModule, {
    logger: ['log', 'warn', 'error'],
  });

  const seeder = app.get(DatabaseSeeder);

  try {
    await seeder.run();
    process.exitCode = 0;
  } catch {
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
