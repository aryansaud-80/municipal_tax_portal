import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import type { RolePermissionsEntity } from '../../rolePermissions/entities/rolePermissions.entity';
import type { UserRoleEntity } from '../../user-roles/entities/user-role.entity';

@Entity({ name: 'roles' })
export class RolesEntity extends BaseEntity {
  @Column()
  name!: string;

  @Column()
  code!: string;

  @Column()
  description!: string;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany('UserRoleEntity', (userRole: UserRoleEntity) => userRole.role)
  userRoles!: UserRoleEntity[];

  @OneToMany('RolePermissionsEntity', (rp: RolePermissionsEntity) => rp.role)
  rolePermissions!: RolePermissionsEntity[];
}
