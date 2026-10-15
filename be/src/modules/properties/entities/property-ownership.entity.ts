import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities';

@Entity({ name: 'property_ownerships' })
export class PropertyOwnershipEntity extends BaseEntity {
  @Column({ name: 'property_id', type: 'uuid' })
  propertyId!: string;

  @ManyToOne('PropertyEntity', { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property?: any;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne('UsersEntity', { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: any;

  @Column({
    name: 'share_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 100,
  })
  sharePercent!: number;

  @Column({ name: 'acquired_at', type: 'timestamptz', default: () => 'NOW()' })
  acquiredAt!: Date;

  @Column({ name: 'released_at', type: 'timestamptz', nullable: true })
  releasedAt?: Date;

  @Column({ name: 'is_current', type: 'boolean', default: true })
  isCurrent!: boolean;

  @Column({
    name: 'acquisition_type',
    type: 'varchar',
    length: 50,
    default: 'registration',
  })
  acquisitionType!: string;

  @Column({ name: 'recorded_by', type: 'uuid', nullable: true })
  recordedBy?: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;
}
