import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import { RefreshTokenEntity } from '../../auth/entities/refreshToken.entity';
import { UserRoleEntity } from '../../user-roles/entities/user-role.entity';
import { UserStatusEnum } from '../enums/user-status.enum';

@Entity({ name: 'users' })
export class UsersEntity extends BaseEntity {
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId!: string;

  @ManyToOne(() => UsersEntity, (user) => user.ownedUsers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'owner_id' })
  owner?: UsersEntity;

  @OneToMany(() => UsersEntity, (user) => user.owner)
  ownedUsers!: UsersEntity[];

  @Column({ name: 'first_name', type: 'varchar', length: 255 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 255 })
  lastName!: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'phone', type: 'varchar', length: 15, unique: true })
  phone!: string;

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

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user)
  userRoles!: UserRoleEntity[];

  @OneToMany(() => RefreshTokenEntity, (refreshToken) => refreshToken.user)
  refreshTokens!: RefreshTokenEntity[];
}
