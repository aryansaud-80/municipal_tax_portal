import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import type { PropertyApplicationEntity } from './property-application.entity';

@Entity({ name: 'property_documents' })
export class PropertyDocumentEntity extends BaseEntity {
  @Column({ name: 'application_id', type: 'uuid', nullable: true })
  applicationId?: string;

  @ManyToOne('PropertyApplicationEntity', {
    eager: false,
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application?: PropertyApplicationEntity | null;

  @Column({ name: 'property_id', type: 'uuid', nullable: true })
  propertyId?: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name: 'stored_path', type: 'varchar', length: 500 })
  storedPath!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes!: number;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy!: string;
}
