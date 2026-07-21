import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import type { RolePermissionsEntity } from '../../rolePermissions/entities/rolePermissions.entity';
import { PermissionModule } from '../enums/permission-module.enum';
import { PermissionAction } from '../enums/permission-action.enum';

@Entity({ name: 'permissions' })
export class PermissionsEntity extends BaseEntity {
  @Column({ type: 'enum', enum: PermissionModule })
  module!: PermissionModule;

  @Column({
    type: 'enum',
    enum: PermissionAction,
  })
  action!: PermissionAction;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  description!: string;

  @OneToMany(
    'RolePermissionsEntity',
    (rp: RolePermissionsEntity) => rp.permission,
  )
  rolePermissions!: RolePermissionsEntity[];
}
