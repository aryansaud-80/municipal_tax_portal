import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenEntity } from '../auth/entities/refreshToken.entity';
import { UserRoleEntity } from '../user-roles/entities/user-role.entity';
import { UsersEntity } from './entities/users.entity';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UsersEntity, UserRoleEntity, RefreshTokenEntity]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
