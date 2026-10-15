import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../entities/notification.entity';
import { NotificationTypeEnum } from '../../../common/enums/notification-type.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationTypeEnum;
    link?: string;
  }): Promise<NotificationEntity> {
    const entity = this.repo.create({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type ?? NotificationTypeEnum.INFO,
      link: data.link,
    });
    return this.repo.save(entity);
  }

  async findAllForUser(userId: string): Promise<NotificationEntity[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(
    id: string,
    requesterId?: string,
  ): Promise<NotificationEntity> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Notification '${id}' not found`);
    if (requesterId && entity.userId !== requesterId) {
      throw new ForbiddenException(
        'You cannot modify another user\u2019s notification',
      );
    }
    entity.isRead = true;
    return this.repo.save(entity);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
  }

  async countUnread(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } });
  }
}
