import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import { PropertyApplicationStatusEnum } from '../../../common/enums/property-application-status.enum';
import { PropertyTypeEnum } from '../../../common/enums/property-type.enum';
import type { UsersEntity } from '../../users/entities/users.entity';
import type { PropertyDocumentEntity } from './property-document.entity';

@Entity({ name: 'property_applications' })
export class PropertyApplicationEntity extends BaseEntity {
  @Column({
    name: 'application_number',
    type: 'varchar',
    length: 50,
    unique: true,
  })
  applicationNumber!: string;

  @Column({ name: 'applicant_user_id', type: 'uuid' })
  applicantUserId!: string;

  @ManyToOne('UsersEntity', { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicant_user_id' })
  applicant?: UsersEntity;

  @Column({ name: 'owner_name', type: 'varchar', length: 255 })
  ownerName!: string;

  @Column({ name: 'address', type: 'varchar', length: 500 })
  address!: string;

  @Column({ name: 'ward', type: 'int' })
  ward!: number;

  @Column({ name: 'tole', type: 'varchar', length: 255, nullable: true })
  tole?: string;

  @Column({ name: 'area_sq_meters', type: 'decimal', precision: 12, scale: 2 })
  areaSqMeters!: number;

  @Column({ name: 'property_type', type: 'enum', enum: PropertyTypeEnum })
  propertyType!: PropertyTypeEnum;

  @Column({
    name: 'land_ownership_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  landOwnershipNumber?: string;

  @Column({ name: 'floor_count', type: 'int', default: 1 })
  floorCount!: number;

  @Column({ name: 'building_age_years', type: 'int', nullable: true })
  buildingAgeYears?: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: PropertyApplicationStatusEnum,
    default: PropertyApplicationStatusEnum.PENDING,
  })
  status!: PropertyApplicationStatusEnum;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes?: string;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'property_id', type: 'uuid', nullable: true })
  propertyId?: string;

  @Column({ name: 'resubmission_count', type: 'int', default: 0 })
  resubmissionCount!: number;

  @Column({ name: 'submitted_by_staff_id', type: 'uuid', nullable: true })
  submittedByStaffId?: string;

  @OneToMany(
    'PropertyDocumentEntity',
    (d: PropertyDocumentEntity) => d.application,
  )
  documents?: PropertyDocumentEntity[];
}
