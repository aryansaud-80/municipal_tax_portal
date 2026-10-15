import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxCategoryEntity } from './entities/tax-category.entity';
import { TaxCategoriesController } from './controllers/tax-categories.controller';
import { TaxCategoriesService } from './services/tax-categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaxCategoryEntity])],
  controllers: [TaxCategoriesController],
  providers: [TaxCategoriesService],
  exports: [TaxCategoriesService, TypeOrmModule],
})
export class TaxCategoriesModule {}
