import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import { UserRoleEntity } from '../../user-roles/entities/user-role.entity';
import { RolePermissionsEntity } from '../../rolePermissions/entities/rolePermissions.entity';

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

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.role)
  userRoles!: UserRoleEntity[];

  @OneToMany(() => RolePermissionsEntity, (rp) => rp.role)
  rolePermissions!: RolePermissionsEntity[];
}
