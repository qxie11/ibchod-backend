import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { SmartphoneService } from './smartphone.service';
import { CreateSmartphoneDto } from './create-smartphone.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('smartphones')
export class SmartphoneController {
  constructor(private readonly smartphoneService: SmartphoneService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('color') color?: string,
    @Query('capacity') capacity?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('search') search?: string,
  ) {
    return this.smartphoneService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      color,
      capacity,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      search,
    });
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'gallery', maxCount: 10 }], {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async create(
    @Body() createSmartphoneDto: CreateSmartphoneDto,
    @UploadedFiles() files: { gallery?: Express.Multer.File[] },
  ) {
    const galleryPaths = files.gallery?.map((file) => file.path) || [];
    return this.smartphoneService.create({
      ...createSmartphoneDto,
      gallery: galleryPaths,
    });
  }
}
