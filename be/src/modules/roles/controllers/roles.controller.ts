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
import { RolesService } from '../services/roles.services';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { QueryRoleDto } from '../dto/query-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(@Query() query: QueryRoleDto) {
    return this.rolesService.findAll(query);
  }

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    return this.rolesService.findByCode(code);
  }

  @Get('name/:name')
  async findByName(@Param('name') name: string) {
    return this.rolesService.findByName(name);
  }

  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id') id: string) {
    return this.rolesService.toggleStatus(id);
  }
}
