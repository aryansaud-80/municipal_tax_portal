import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PropertyApplicationsService } from './property-applications.service';
import { CreatePropertyApplicationDto } from './dto/create-property-application.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PropertyApplicationStatusEnum } from '../../common/enums/property-application-status.enum';

@Controller('property-applications')
export class PropertyApplicationsController {
  constructor(private readonly service: PropertyApplicationsService) {}

  @Post('my')
  @Permissions('propertyTax.create')
  @HttpCode(HttpStatus.CREATED)
  async submitMine(
    @Body() dto: CreatePropertyApplicationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.submit(dto, userId);
  }

  @Get('my')
  @Permissions('propertyTax.view')
  @HttpCode(HttpStatus.OK)
  async findMine(@CurrentUser('id') userId: string) {
    return this.service.findMine(userId);
  }

  @Post()
  @Permissions('propertyApplication.create')
  @HttpCode(HttpStatus.CREATED)
  async submitForCitizen(
    @Body() dto: CreatePropertyApplicationDto,
    @CurrentUser('id') staffId: string,
  ) {
    return this.service.submit(dto, dto.applicantUserId ?? staffId, staffId);
  }

  @Get()
  @Permissions('propertyApplication.view')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query()
    query: {
      page?: number;
      limit?: number;
      status?: PropertyApplicationStatusEnum;
      ward?: number;
    },
  ) {
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

  @Patch(':id/review')
  @Permissions('propertyApplication.approve')
  @HttpCode(HttpStatus.OK)
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewApplicationDto,
    @CurrentUser('id') reviewerId: string,
  ) {
    return this.service.review(id, dto, reviewerId);
  }

  @Patch(':id/resubmit')
  @Permissions('propertyTax.create')
  @HttpCode(HttpStatus.OK)
  async resubmit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePropertyApplicationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.resubmit(id, dto, userId);
  }

  @Post(':id/documents')
  @Permissions('propertyTax.create')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile()
    file: { buffer: Buffer; originalname: string; mimetype: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') permissions: string[],
  ) {
    if (!file) {
      return { message: 'No file provided' };
    }
    const staff = (permissions ?? []).includes('propertyApplication.view');
    return this.service.attachDocument(
      id,
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
      },
      userId,
      staff,
    );
  }

  @Get('documents/:documentId/file')
  @Permissions('propertyTax.view')
  @HttpCode(HttpStatus.OK)
  async download(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') permissions: string[],
    @Res() res: Response,
  ) {
    const staff = (permissions ?? []).includes('propertyApplication.view');
    const doc = await this.service.readDocument(documentId, userId, staff);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${doc.fileName}"`,
    );
    res.send(doc.buffer);
  }
}
