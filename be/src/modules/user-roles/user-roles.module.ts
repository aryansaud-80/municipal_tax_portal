import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesEntity } from '../roles/entities/roles.entity';
import { UsersEntity } from '../users/entities/users.entity';
import { UserRoleEntity } from './entities/user-role.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserRoleEntity, UsersEntity, RolesEntity]),
  ],
  exports: [TypeOrmModule],
})
export class UserRolesModule {}
