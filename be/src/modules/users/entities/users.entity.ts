import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import type { RefreshTokenEntity } from '../../auth/entities/refreshToken.entity';
import type { UserRoleEntity } from '../../user-roles/entities/user-role.entity';
import { UserStatusEnum } from '../enums/user-status.enum';

@Entity({ name: 'users' })
export class UsersEntity extends BaseEntity {
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId!: string;

  @ManyToOne('UsersEntity', (user: UsersEntity) => user.ownedUsers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'owner_id' })
  owner?: UsersEntity;

  @OneToMany('UsersEntity', (user: UsersEntity) => user.owner)
  ownedUsers!: UsersEntity[];

  @Column({ name: 'first_name', type: 'varchar', length: 255 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 255 })
  lastName!: string;

  @Column({ name: 'username', type: 'varchar', length: 255, unique: true })
  username!: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 15, unique: true })
  phoneNumber!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'profile_img', type: 'varchar', length: 255, nullable: true })
  profileImg?: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: UserStatusEnum,
    default: UserStatusEnum.ACTIVE,
  })
  status!: UserStatusEnum;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ name: 'phone_verified', type: 'boolean', default: false })
  phoneVerified!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean;

  @OneToMany('UserRoleEntity', (userRole: UserRoleEntity) => userRole.user)
  userRoles!: UserRoleEntity[];

  @OneToMany(
    'RefreshTokenEntity',
    (refreshToken: RefreshTokenEntity) => refreshToken.user,
  )
  refreshTokens!: RefreshTokenEntity[];
}
