import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenEntity } from '../auth/entities/refreshToken.entity';
import { UserRoleEntity } from '../user-roles/entities/user-role.entity';
import { UsersEntity } from './entities/users.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UsersEntity, UserRoleEntity, RefreshTokenEntity]),
  ],
  exports: [TypeOrmModule],
})
export class UsersModule {}
