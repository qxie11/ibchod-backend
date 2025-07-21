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
    name?: string;
  }) {
    const {
      skip = 0,
      take = 10,
      color,
      capacity,
      minPrice,
      maxPrice,
      search,
      name,
    } = params;

    const where: any = {
      color,
      capacity: capacity && +capacity,
      price: {
        gte: minPrice && +minPrice,
        lte: maxPrice && maxPrice,
      },
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(search &&
        (() => {
          const terms = search.trim().split(/\s+/);
          return {
            AND: terms.map((term) => ({
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { slug: { contains: term, mode: 'insensitive' } },
                { color: { contains: term, mode: 'insensitive' } },
                { capacity: isNaN(Number(term)) ? undefined : Number(term) },
              ].filter(Boolean),
            })),
          };
        })()),
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

  async getBySlug(slug: string) {
    return this.prisma.smartphone.findUnique({ where: { slug } });
  }

  async getFilters() {
    const [min, max, names, colors, capacities] = await Promise.all([
      this.prisma.smartphone.aggregate({ _min: { price: true } }),
      this.prisma.smartphone.aggregate({ _max: { price: true } }),
      this.prisma.smartphone.findMany({
        select: { name: true },
        distinct: ['name'],
      }),
      this.prisma.smartphone.findMany({
        select: { color: true },
        distinct: ['color'],
      }),
      this.prisma.smartphone.findMany({
        select: { capacity: true },
        distinct: ['capacity'],
      }),
    ]);
    return {
      minPrice: min._min.price,
      maxPrice: max._max.price,
      names: names.map((n) => n.name),
      colors: colors.map((c) => c.color),
      capacities: capacities.map((c) => c.capacity),
    };
  }
}
