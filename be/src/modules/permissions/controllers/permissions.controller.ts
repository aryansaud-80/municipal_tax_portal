import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PermissionsService } from '../services/permissions.service';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { QueryPermissionDto } from '../dto/query-permission.dto';
import { PermissionModule } from '../enums/permission-module.enum';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  async create(@Body() pDto: CreatePermissionDto) {
    return this.permissionsService.create(pDto);
  }

  @Get()
  async findAll(@Query() query: QueryPermissionDto) {
    return this.permissionsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() pDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, pDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    return this.permissionsService.findByCode(code);
  }

  @Get('module/:module')
  async findByModule(@Param('module') module: PermissionModule) {
    return this.permissionsService.findByModule(module);
  }
}
