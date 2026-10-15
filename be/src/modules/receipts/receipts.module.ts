import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiptEntity } from './entities/receipt.entity';
import { ReceiptsController } from './controllers/receipts.controller';
import { ReceiptsService } from './services/receipts.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReceiptEntity])],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService, TypeOrmModule],
})
export class ReceiptsModule {}
