import { PermissionsEntity } from '../../permissions/entities/permissions.entity';
import { RolesEntity } from '../../roles/entities/roles.entity';
import { UsersEntity } from '../../users/entities/users.entity';
import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'role_permissions' })
export class RolePermissionsEntity {
  @PrimaryColumn({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => RolesEntity, (role) => role.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role!: RolesEntity;

  @PrimaryColumn({ name: 'permission_id', type: 'uuid' })
  permissionId!: string;

  @ManyToOne(
    () => PermissionsEntity,
    (permission) => permission.rolePermissions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'permission_id' })
  permission!: PermissionsEntity;

  @CreateDateColumn({
    name: 'assigned_at',
    type: 'timestamp',
  })
  assignedAt!: Date;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy!: string | null;

  @ManyToOne(() => UsersEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_by' })
  assignedByUser?: UsersEntity;
}
