import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSmartphoneDto } from './create-smartphone.dto';

@Injectable()
export class SmartphoneService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    color?: string;
    capacity?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }) {
    const {
      skip = 0,
      take = 10,
      color,
      capacity,
      minPrice,
      maxPrice,
      search,
    } = params;

    const where: any = {
      color,
      capacity: capacity && +capacity,
      price: {
        gte: minPrice && +minPrice,
        lte: maxPrice && maxPrice,
      },
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Удаляем undefined фильтры
    Object.keys(where).forEach(
      (key) => where[key] === undefined && delete where[key],
    );
    if (
      where.price &&
      where.price.gte === undefined &&
      where.price.lte === undefined
    ) {
      delete where.price;
    }

    const [rawItems, total] = await Promise.all([
      this.prisma.smartphone.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.smartphone.count({ where }),
    ]);

    const baseUrl = process.env.BASE_URL?.replace(/\/$/, '') || '';
    const items = rawItems.map((item) => ({
      ...item,
      gallery: Array.isArray(item.gallery)
        ? item.gallery.map((url: string) =>
            url.startsWith('http')
              ? url
              : baseUrl + (url.startsWith('/') ? url : '/' + url),
          )
        : [],
    }));

    return { items, total, skip };
  }

  async create(dto: CreateSmartphoneDto) {
    const existingSlug = await this.prisma.smartphone.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new Error('Smartphone with this slug already exists');
    }
    return this.prisma.smartphone.create({
      data: dto,
    });
  }
}
