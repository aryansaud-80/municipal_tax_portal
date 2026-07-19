import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import { RolePermissionsEntity } from '../../rolePermissions/entities/rolePermissions.entity';

@Entity({ name: 'permissions' })
export class PermissionsEntity extends BaseEntity {
  @Column()
  module!: string;

  @Column()
  action!: string;

  @Column()
  name!: string;

  @Column()
  code!: string;

  @Column()
  description!: string;

  @OneToMany(() => RolePermissionsEntity, (rp) => rp.permission)
  rolePermissions!: RolePermissionsEntity[];
}
