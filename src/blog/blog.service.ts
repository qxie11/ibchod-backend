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
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          excerpt: true,
          featuredImage: true,
          tags: true,
          author: true,
          published: true,
          publishedAt: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.blog.count({ where }),
    ]);

    const items = rawItems.map((item) => ({
      ...item,
      featuredImage: item.featuredImage ?? null,
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

    // Transform data from multipart/form-data
    const published = dto.published === 'true' || dto.published === true;
    const publishedAt = published ? new Date() : null;

    // Handle tags - can be string or array
    let tags: string[] = [];
    if (typeof dto.tags === 'string') {
      tags = dto.tags.split(',').map((tag) => tag.trim());
    } else if (Array.isArray(dto.tags)) {
      tags = dto.tags;
    }

    const blog = await this.prisma.blog.create({
      data: {
        ...dto,
        featuredImage: dto.featuredImage ?? null,
        published,
        publishedAt,
        tags,
      },
    });

    return {
      ...blog,
      featuredImage: blog.featuredImage ?? null,
    };
  }

  async getBySlug(slug: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        featuredImage: true,
        tags: true,
        author: true,
        published: true,
        publishedAt: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!blog) {
      throw new Error('Blog post not found');
    }

    // Increment view count
    await this.prisma.blog.update({
      where: { id: blog.id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      ...blog,
      featuredImage: blog.featuredImage ?? null,
    };
  }

  async findById(id: number) {
    const blog = await this.prisma.blog.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        featuredImage: true,
        tags: true,
        author: true,
        published: true,
        publishedAt: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!blog) return null;

    return {
      ...blog,
      featuredImage: blog.featuredImage ?? null,
    };
  }

  async getPopularPosts(limit: number = 5) {
    const blogs = await this.prisma.blog.findMany({
      where: { published: true },
      orderBy: { viewCount: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        featuredImage: true,
        tags: true,
        author: true,
        published: true,
        publishedAt: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return blogs.map((blog) => ({
      ...blog,
      featuredImage: blog.featuredImage ?? null,
    }));
  }

  async getRecentPosts(limit: number = 5) {
    const blogs = await this.prisma.blog.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return blogs.map((blog) => ({
      ...blog,
      featuredImage: blog.featuredImage ?? null,
    }));
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

    // Transform data from multipart/form-data
    const published = dto.published === 'true' || dto.published === true;

    // Handle publishing logic
    let publishedAt = existingBlog.publishedAt;
    if (dto.published !== undefined) {
      if (published && !existingBlog.published) {
        publishedAt = new Date(); // Publish now
      } else if (!published) {
        publishedAt = null; // Unpublish
      }
    }

    // Handle tags - can be string or array
    let tags: string[] | undefined;
    if (dto.tags !== undefined) {
      if (typeof dto.tags === 'string') {
        tags = dto.tags.split(',').map((tag) => tag.trim());
      } else if (Array.isArray(dto.tags)) {
        tags = dto.tags;
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.slug !== undefined) updateData.slug = dto.slug;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.excerpt !== undefined) updateData.excerpt = dto.excerpt;
    if (dto.featuredImage !== undefined)
      updateData.featuredImage = dto.featuredImage;
    if (tags !== undefined) updateData.tags = tags;
    if (dto.author !== undefined) updateData.author = dto.author;
    if (dto.published !== undefined) updateData.published = published;
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt;

    const blog = await this.prisma.blog.update({
      where: { id },
      data: updateData,
    });

    return {
      ...blog,
      featuredImage: blog.featuredImage ?? null,
    };
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
