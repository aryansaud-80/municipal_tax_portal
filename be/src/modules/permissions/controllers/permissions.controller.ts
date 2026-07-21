import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from '../services/permissions.service';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { QueryPermissionDto } from '../dto/query-permission.dto';
import { PermissionModule } from '../enums/permission-module.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Permissions('permission.create')
  async create(@Body() pDto: CreatePermissionDto) {
    return this.permissionsService.create(pDto);
  }

  @Get()
  @Permissions('permission.view')
  async findAll(@Query() query: QueryPermissionDto) {
    return this.permissionsService.findAll(query);
  }

  @Get('code/:code')
  @Permissions('permission.view')
  async findByCode(@Param('code') code: string) {
    return this.permissionsService.findByCode(code);
  }

  @Get('module/:module')
  @Permissions('permission.view')
  async findByModule(@Param('module') module: PermissionModule) {
    return this.permissionsService.findByModule(module);
  }

  @Get(':id')
  @Permissions('permission.view')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('permission.update')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() pDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, pDto);
  }

  @Delete(':id')
  @Permissions('permission.delete')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.permissionsService.remove(id);
  }
}
