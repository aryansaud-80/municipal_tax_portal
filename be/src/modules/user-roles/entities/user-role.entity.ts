import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import { RolesEntity } from '../../roles/entities/roles.entity';
import { UsersEntity } from '../../users/entities/users.entity';

@Entity({ name: 'user_roles' })
export class UserRoleEntity extends BaseEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UsersEntity, (user) => user.userRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UsersEntity;

  @PrimaryColumn({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => RolesEntity, (role) => role.userRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role!: RolesEntity;

  @CreateDateColumn({ name: 'assigned_at', type: 'timestamptz' })
  assignedAt!: Date;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy?: string;

  @ManyToOne(() => UsersEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_by' })
  assignedByUser?: UsersEntity;
}
