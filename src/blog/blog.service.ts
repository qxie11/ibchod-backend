import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBlogDto } from './create-blog.dto';
import { UpdateBlogDto } from './update-blog.dto';
import { S3Service } from '../common/s3/s3.service';

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    tag?: string;
    author?: string;
    published?: boolean;
  }) {
    const {
      skip = 0,
      take = 10,
      search,
      tag,
      author,
      published = true,
    } = params;

    const where: any = {
      published,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(tag && { tags: { has: tag } }),
      ...(author && { author: { contains: author, mode: 'insensitive' } }),
    };

    const [rawItems, total] = await Promise.all([
      this.prisma.blog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.blog.count({ where }),
    ]);

    const baseUrl = process.env.BASE_URL?.replace(/\/$/, '') || '';
    const items = rawItems.map((item) => ({
      ...item,
      featuredImage: item.featuredImage
        ? item.featuredImage.startsWith('http')
          ? item.featuredImage
          : baseUrl +
            (item.featuredImage.startsWith('/')
              ? item.featuredImage
              : '/' + item.featuredImage)
        : undefined,
    }));

    return { items, total, skip };
  }

  async create(dto: CreateBlogDto) {
    const existingSlug = await this.prisma.blog.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new Error('Blog post with this slug already exists');
    }

    const published = dto.published === true;
    const publishedAt = published ? new Date() : null;

    return this.prisma.blog.create({
      data: {
        ...dto,
        published,
        publishedAt,
        tags: dto.tags || [],
      },
    });
  }

  async getBySlug(slug: string) {
    const blog = await this.prisma.blog.findUnique({ where: { slug } });
    if (!blog) {
      throw new Error('Blog post not found');
    }

    // Increment view count
    await this.prisma.blog.update({
      where: { id: blog.id },
      data: { viewCount: { increment: 1 } },
    });

    const baseUrl = process.env.BASE_URL?.replace(/\/$/, '') || '';
    return {
      ...blog,
      featuredImage: blog.featuredImage
        ? blog.featuredImage.startsWith('http')
          ? blog.featuredImage
          : baseUrl +
            (blog.featuredImage.startsWith('/')
              ? blog.featuredImage
              : '/' + blog.featuredImage)
        : undefined,
    };
  }

  async findById(id: number) {
    return this.prisma.blog.findUnique({ where: { id } });
  }

  async getPopularPosts(limit: number = 5) {
    return this.prisma.blog.findMany({
      where: { published: true },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });
  }

  async getRecentPosts(limit: number = 5) {
    return this.prisma.blog.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  async getTags() {
    const blogs = await this.prisma.blog.findMany({
      where: { published: true },
      select: { tags: true },
    });

    const allTags = blogs.flatMap((blog) => blog.tags);
    const uniqueTags = [...new Set(allTags)];

    return uniqueTags.map((tag) => ({
      name: tag,
      count: allTags.filter((t) => t === tag).length,
    }));
  }

  async update(id: number, dto: UpdateBlogDto) {
    const existingBlog = await this.prisma.blog.findUnique({
      where: { id },
    });
    if (!existingBlog) {
      throw new Error('Blog post not found');
    }

    // Only check slug conflicts if slug is being updated
    if (dto.slug && dto.slug !== existingBlog.slug) {
      const existingSlug = await this.prisma.blog.findUnique({
        where: { slug: dto.slug },
      });
      if (existingSlug) {
        throw new Error('Blog post with this slug already exists');
      }
    }

    // Handle publishing logic
    let publishedAt = existingBlog.publishedAt;
    if (dto.published !== undefined) {
      if (dto.published && !existingBlog.published) {
        publishedAt = new Date(); // Publish now
      } else if (!dto.published) {
        publishedAt = null; // Unpublish
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.slug !== undefined) updateData.slug = dto.slug;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.excerpt !== undefined) updateData.excerpt = dto.excerpt;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.author !== undefined) updateData.author = dto.author;
    if (dto.published !== undefined) updateData.published = dto.published;
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt;

    return this.prisma.blog.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number) {
    const existingBlog = await this.prisma.blog.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      throw new Error('Blog post not found');
    }

    // Delete featured image from S3 if it exists
    if (existingBlog.featuredImage) {
      try {
        const url = new URL(existingBlog.featuredImage);
        const key = url.pathname.substring(1);
        await this.s3Service.deleteFile({ key });
        console.log(`Successfully deleted featured image from S3: ${key}`);
      } catch (error) {
        console.warn(
          `Failed to delete featured image from S3: ${existingBlog.featuredImage}`,
          error,
        );
      }
    }

    await this.prisma.blog.delete({
      where: { id },
    });

    return {
      message: 'Blog post deleted successfully',
      deletedBlog: existingBlog,
    };
  }
}
