import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import { PropertyStatusEnum } from '../../../common/enums/property-status.enum';
import { PropertyTypeEnum } from '../../../common/enums/property-type.enum';
import { VerificationStatusEnum } from '../../../common/enums/verification-status.enum';

@Entity({ name: 'properties' })
export class PropertyEntity extends BaseEntity {
  @Column({
    name: 'property_number',
    type: 'varchar',
    length: 50,
    unique: true,
  })
  propertyNumber!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne('UsersEntity', { eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: any;

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

  @Column({
    name: 'property_type',
    type: 'enum',
    enum: PropertyTypeEnum,
    default: PropertyTypeEnum.RESIDENTIAL,
  })
  propertyType!: PropertyTypeEnum;

  @Column({
    name: 'status',
    type: 'enum',
    enum: PropertyStatusEnum,
    default: PropertyStatusEnum.ACTIVE,
  })
  status!: PropertyStatusEnum;

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
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatusEnum,
    default: VerificationStatusEnum.UNVERIFIED,
  })
  verificationStatus!: VerificationStatusEnum;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @OneToMany(
    'TaxAssessmentEntity',
    (assessment: { property: unknown }) => assessment.property,
  )
  taxAssessments?: any[];
}
