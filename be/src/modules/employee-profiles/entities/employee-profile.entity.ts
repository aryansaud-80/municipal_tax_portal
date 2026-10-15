import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities';

@Entity({ name: 'employee_profiles' })
export class EmployeeProfileEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @OneToOne('UsersEntity', { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: any;

  @Column({ name: 'position', type: 'varchar', length: 100, nullable: true })
  position?: string;

  @Column({ name: 'ward_assignments', type: 'int', array: true, default: '{}' })
  wardAssignments!: number[];

  @Column({ name: 'can_verify_payments', type: 'boolean', default: false })
  canVerifyPayments!: boolean;

  @Column({ name: 'can_assess', type: 'boolean', default: false })
  canAssess!: boolean;

  @Column({ name: 'can_approve_property', type: 'boolean', default: false })
  canApproveProperty!: boolean;
}
