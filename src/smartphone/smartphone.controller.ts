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
} from '@nestjs/common';
import { SmartphoneService } from './smartphone.service';
import { CreateSmartphoneDto } from './create-smartphone.dto';
import { UpdateSmartphoneDto } from './update-smartphone.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { memoryStorage } from 'multer';

@Controller('smartphones')
export class SmartphoneController {
  constructor(
    private readonly smartphoneService: SmartphoneService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('color') color?: string,
    @Query('capacity') capacity?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('search') search?: string,
    @Query('name') name?: string,
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
    });
  }

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.smartphoneService.getBySlug(slug);
  }

  @Get('related-smartphones/:slug')
  async getRelatedSmartphones(@Param('slug') slug: string) {
    return await this.smartphoneService.getRelatedSmartphones(slug);
  }

  @Get('filters')
  async getFilters() {
    return this.smartphoneService.getFilters();
  }

  @Post()
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

    const uploadResults = await Promise.all(
      galleryFiles.map((file) =>
        this.cloudinaryService.uploadImage(file.buffer),
      ),
    );

    const galleryUrls = uploadResults.map((res) => res.secure_url);

    return this.smartphoneService.create({
      ...createSmartphoneDto,
      gallery: galleryUrls,
    });
  }

  @Patch(':id')
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

    let galleryUrls: string[] = [];

    if (galleryFiles.length > 0) {
      const uploadResults = await Promise.all(
        galleryFiles.map((file) =>
          this.cloudinaryService.uploadImage(file.buffer),
        ),
      );
      galleryUrls = uploadResults.map((res) => res.secure_url);
    }

    return this.smartphoneService.update(Number(id), {
      ...updateSmartphoneDto,
      ...(galleryUrls.length > 0 && { gallery: galleryUrls }),
    });
  }
}
