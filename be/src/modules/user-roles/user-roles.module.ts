import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesEntity } from '../roles/entities/roles.entity';
import { UsersEntity } from '../users/entities/users.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { UserRolesController } from './controllers/user-roles.controller';
import { UserRolesService } from './services/user-roles.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserRoleEntity, UsersEntity, RolesEntity]),
  ],
  providers: [UserRolesService],
  controllers: [UserRolesController],
  exports: [UserRolesService,  TypeOrmModule],
})
export class UserRolesModule {}
