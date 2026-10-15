import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities';
import { NotificationTypeEnum } from '../../../common/enums/notification-type.enum';

@Entity({ name: 'notifications' })
export class NotificationEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne('UsersEntity', { eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: any;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'message', type: 'text' })
  message!: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: NotificationTypeEnum,
    default: NotificationTypeEnum.INFO,
  })
  type!: NotificationTypeEnum;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ name: 'link', type: 'varchar', length: 500, nullable: true })
  link?: string;
}
