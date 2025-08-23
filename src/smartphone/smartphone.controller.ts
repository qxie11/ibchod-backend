import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  ValidationPipe,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SmartphoneService } from './smartphone.service';
import { CreateSmartphoneDto } from './create-smartphone.dto';
import { UpdateSmartphoneDto } from './update-smartphone.dto';
import {
  SmartphoneResponse,
  SmartphoneListResponse,
  FiltersResponse,
} from './smartphone-response.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../common/s3/s3.service';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@ApiTags('Smartphones')
@Controller('smartphones')
export class SmartphoneController {
  constructor(
    private readonly smartphoneService: SmartphoneService,
    private readonly s3Service: S3Service,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all smartphones with filters' })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Number of items to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Number of items to take',
  })
  @ApiQuery({ name: 'color', required: false, description: 'Filter by color' })
  @ApiQuery({
    name: 'capacity',
    required: false,
    description: 'Filter by capacity',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price filter',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price filter',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'name', required: false, description: 'Filter by name' })
  @ApiOkResponse({ type: SmartphoneListResponse })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('color') color?: string,
    @Query('capacity') capacity?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('search') search?: string,
    @Query('name') name?: string,
    @Query('active') active: string = 'true',
  ) {
    return this.smartphoneService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      color,
      capacity,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      search,
      name,
      active: active === 'true',
    });
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get smartphone by slug' })
  @ApiParam({ name: 'slug', description: 'Smartphone slug' })
  @ApiOkResponse({ type: SmartphoneResponse })
  @ApiNotFoundResponse({ description: 'Smartphone not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getBySlug(@Param('slug') slug: string) {
    return this.smartphoneService.getBySlug(slug);
  }

  @Get('related-smartphones/:slug')
  @ApiOperation({ summary: 'Get related smartphones' })
  @ApiParam({ name: 'slug', description: 'Smartphone slug' })
  @ApiOkResponse({ type: [SmartphoneResponse] })
  @ApiNotFoundResponse({ description: 'Smartphone not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getRelatedSmartphones(@Param('slug') slug: string) {
    return await this.smartphoneService.getRelatedSmartphones(slug);
  }

  @Get('filters')
  @ApiOperation({ summary: 'Get available filters' })
  @ApiOkResponse({ type: FiltersResponse })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getFilters() {
    return this.smartphoneService.getFilters();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new smartphone' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateSmartphoneDto })
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: SmartphoneResponse })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'gallery', maxCount: 10 }], {
      storage: memoryStorage(),
    }),
  )
  async create(
    @Body(new ValidationPipe()) createSmartphoneDto: CreateSmartphoneDto,
    @UploadedFiles() files: { gallery?: Express.Multer.File[] },
  ) {
    const galleryFiles = files.gallery || [];

    const uploadPromises = galleryFiles.map(async (file) => {
      const key = this.s3Service.generateFileKey(
        file.originalname,
        'smartphones',
      );

      const fileUrl = await this.s3Service.uploadFile({
        key,
        buffer: file.buffer,
        contentType: file.mimetype,
      });

      return fileUrl;
    });

    const galleryUrls = await Promise.all(uploadPromises);

    return this.smartphoneService.create({
      ...createSmartphoneDto,
      gallery: galleryUrls,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update smartphone by ID' })
  @ApiParam({ name: 'id', description: 'Smartphone ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateSmartphoneDto })
  @ApiBearerAuth()
  @ApiOkResponse({ type: SmartphoneResponse })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiNotFoundResponse({ description: 'Smartphone not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'gallery', maxCount: 10 }], {
      storage: memoryStorage(),
    }),
  )
  async update(
    @Param('id') id: string,
    @Body(
      new ValidationPipe({
        skipMissingProperties: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    updateSmartphoneDto: UpdateSmartphoneDto,
    @UploadedFiles() files: { gallery?: Express.Multer.File[] },
  ) {
    const galleryFiles = files?.gallery || [];

    // Get current smartphone to access existing gallery
    const currentSmartphone = await this.smartphoneService.findById(Number(id));
    if (!currentSmartphone) {
      throw new Error('Smartphone not found');
    }

    let galleryUrls: string[] = [];

    if (galleryFiles.length > 0) {
      // Upload new images to S3
      const uploadPromises = galleryFiles.map(async (file) => {
        const key = this.s3Service.generateFileKey(
          file.originalname,
          'smartphones',
        );

        const fileUrl = await this.s3Service.uploadFile({
          key,
          buffer: file.buffer,
          contentType: file.mimetype,
        });

        return fileUrl;
      });

      galleryUrls = await Promise.all(uploadPromises);

      // Delete old images from S3 if they exist
      if (currentSmartphone.gallery && currentSmartphone.gallery.length > 0) {
        const deletePromises = currentSmartphone.gallery.map(
          async (imageUrl: string) => {
            try {
              // Extract key from S3 URL
              const url = new URL(imageUrl);
              const key = url.pathname.substring(1); // Remove leading slash

              await this.s3Service.deleteFile({ key });
            } catch (error) {
              console.warn(`Failed to delete old image: ${imageUrl}`, error);
            }
          },
        );

        await Promise.allSettled(deletePromises);
      }
    }

    return this.smartphoneService.update(Number(id), {
      ...updateSmartphoneDto,
      ...(galleryUrls.length > 0 && { gallery: galleryUrls }),
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete smartphone by ID' })
  @ApiParam({ name: 'id', description: 'Smartphone ID' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Smartphone deleted successfully' })
  @ApiNotFoundResponse({ description: 'Smartphone not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async delete(@Param('id') id: string) {
    // Get smartphone before deletion to access gallery
    const smartphone = await this.smartphoneService.findById(Number(id));
    if (!smartphone) {
      throw new Error('Smartphone not found');
    }

    // Delete images from S3 if they exist
    if (smartphone.gallery && smartphone.gallery.length > 0) {
      const deletePromises = smartphone.gallery.map(
        async (imageUrl: string) => {
          try {
            // Extract key from S3 URL
            const url = new URL(imageUrl);
            const key = url.pathname.substring(1); // Remove leading slash

            await this.s3Service.deleteFile({ key });
          } catch (error) {
            console.warn(`Failed to delete image: ${imageUrl}`, error);
          }
        },
      );

      await Promise.allSettled(deletePromises);
    }

    return this.smartphoneService.delete(Number(id));
  }
}
