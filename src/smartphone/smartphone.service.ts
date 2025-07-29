import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSmartphoneDto } from './create-smartphone.dto';
import { UpdateSmartphoneDto } from './update-smartphone.dto';

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

    const active = dto.active === 'true';
    return this.prisma.smartphone.create({
      data: {
        ...dto,
        active,
      },
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

  async getRelatedSmartphones(slug: string) {
    const smartphone = await this.prisma.smartphone.findUnique({
      where: { slug },
    });
    if (!smartphone) {
      throw new Error('Smartphone not found');
    }
    const related = await this.prisma.smartphone.findMany({
      where: {
        slug: { not: slug },
        OR: [{ name: smartphone.name }, { capacity: smartphone.capacity }],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return related;
  }

  async update(id: number, dto: UpdateSmartphoneDto) {
    const existingSmartphone = await this.prisma.smartphone.findUnique({
      where: { id },
    });
    if (!existingSmartphone) {
      throw new Error('Smartphone not found');
    }

    // Only check slug conflicts if slug is being updated
    if (dto.slug && dto.slug !== existingSmartphone.slug) {
      const existingSlug = await this.prisma.smartphone.findUnique({
        where: { slug: dto.slug },
      });
      if (existingSlug) {
        throw new Error('Smartphone with this slug already exists');
      }
    }

    // Prepare update data, only including provided fields
    const updateData: any = {};
    
    // Only include fields that are actually provided
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.slug !== undefined) updateData.slug = dto.slug;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.capacity !== undefined) updateData.capacity = dto.capacity;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.gallery !== undefined) updateData.gallery = dto.gallery;
    if (dto.large_desc !== undefined) updateData.large_desc = dto.large_desc;
    if (dto.small_desc !== undefined) updateData.small_desc = dto.small_desc;
    
    // Handle active field conversion
    if (dto.active !== undefined) {
      updateData.active = dto.active === 'true';
    }

    return this.prisma.smartphone.update({
      where: { id },
      data: updateData,
    });
  }
}
