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
import { RolesService } from '../services/roles.services';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { QueryRoleDto } from '../dto/query-role.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('role.view')
  async findAll(@Query() query: QueryRoleDto) {
    return this.rolesService.findAll(query);
  }

  @Post()
  @Permissions('role.create')
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get('code/:code')
  @Permissions('role.view')
  async findByCode(@Param('code') code: string) {
    return this.rolesService.findByCode(code);
  }

  @Get('name/:name')
  @Permissions('role.view')
  async findByName(@Param('name') name: string) {
    return this.rolesService.findByName(name);
  }

  @Patch(':id/toggle-status')
  @Permissions('role.update')
  async toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.toggleStatus(id);
  }

  @Get(':id')
  @Permissions('role.view')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('role.update')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @Permissions('role.delete')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.remove(id);
  }
}
