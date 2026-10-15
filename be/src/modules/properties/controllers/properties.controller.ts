import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PropertiesService } from '../services/properties.service';
import { CreatePropertyDto } from '../dto/create-property.dto';
import { UpdatePropertyDto } from '../dto/update-property.dto';
import { QueryPropertyDto } from '../dto/query-property.dto';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PropertyStatusEnum } from '../../../common/enums/property-status.enum';

class TransferOwnershipDto {
  @IsUUID()
  newUserId!: string;

  @IsNumber()
  @Min(0.01)
  @Max(100)
  sharePercent!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

@Controller('properties')
export class PropertiesController {
  constructor(private readonly service: PropertiesService) {}

  @Post('my')
  @Permissions('propertyTax.create')
  @HttpCode(HttpStatus.CREATED)
  async createForCurrentUser(
    @Body() dto: CreatePropertyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.createForUser(dto, userId);
  }

  @Get('my')
  @Permissions('propertyTax.view')
  @HttpCode(HttpStatus.OK)
  async findMine(@CurrentUser('id') userId: string) {
    return this.service.findByUserId(userId);
  }

  @Post()
  @Permissions('propertyTax.create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePropertyDto) {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('propertyTax.view')
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QueryPropertyDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('propertyTax.view')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') permissions: string[],
  ) {
    const staff = (permissions ?? []).includes('propertyApplication.view');
    return this.service.findOne(id, userId, staff);
  }

  @Patch(':id')
  @Permissions('propertyTax.update')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('propertyTax.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }

  @Patch(':id/status')
  @Permissions('propertyTax.update')
  @HttpCode(HttpStatus.OK)
  async toggleStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: PropertyStatusEnum,
  ) {
    return this.service.toggleStatus(id, status);
  }

  @Post(':id/transfer')
  @Permissions('propertyTax.update')
  @HttpCode(HttpStatus.OK)
  async transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferOwnershipDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.transferOwnership(
      id,
      dto.newUserId,
      dto.sharePercent,
      actorId,
      dto.notes,
    );
  }

  @Get(':id/ownership-history')
  @Permissions('propertyTax.view')
  @HttpCode(HttpStatus.OK)
  async history(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') permissions: string[],
  ) {
    const staff = (permissions ?? []).includes('propertyApplication.view');
    await this.service.findOne(id, userId, staff);
    return this.service.ownershipHistory(id);
  }
}
