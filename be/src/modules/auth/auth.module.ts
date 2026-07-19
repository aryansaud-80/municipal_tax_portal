import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersEntity } from '../users/entities/users.entity';
import { RefreshTokenEntity } from './entities/refreshToken.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([RefreshTokenEntity, UsersEntity])],
  exports: [TypeOrmModule],
})
export class AuthModule {}
