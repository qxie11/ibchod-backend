import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  UploadedFile,
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
import { BlogService } from './blog.service';
import { CreateBlogDto } from './create-blog.dto';
import { UpdateBlogDto } from './update-blog.dto';
import { BlogResponse, BlogListResponse } from './blog-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../common/s3/s3.service';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly s3Service: S3Service,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all blog posts with filters' })
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
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag' })
  @ApiQuery({
    name: 'author',
    required: false,
    description: 'Filter by author',
  })
  @ApiQuery({
    name: 'published',
    required: false,
    description: 'Filter by published status',
  })
  @ApiOkResponse({ type: BlogListResponse })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('author') author?: string,
    @Query('published') published: string = 'true',
  ) {
    return this.blogService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      search,
      tag,
      author,
      published: published === 'true',
    });
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get blog post by slug' })
  @ApiParam({ name: 'slug', description: 'Blog post slug' })
  @ApiOkResponse({ type: BlogResponse })
  @ApiNotFoundResponse({ description: 'Blog post not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getBySlug(@Param('slug') slug: string) {
    return this.blogService.getBySlug(slug);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular blog posts' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of posts to return',
  })
  @ApiOkResponse({ type: [BlogResponse] })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getPopularPosts(@Query('limit') limit?: string) {
    return this.blogService.getPopularPosts(limit ? Number(limit) : 5);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent blog posts' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of posts to return',
  })
  @ApiOkResponse({ type: [BlogResponse] })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getRecentPosts(@Query('limit') limit?: string) {
    return this.blogService.getRecentPosts(limit ? Number(limit) : 5);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all tags with post counts' })
  @ApiOkResponse({
    description: 'List of tags with counts',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          count: { type: 'number' },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getTags() {
    return this.blogService.getTags();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new blog post' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateBlogDto })
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: BlogResponse })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseInterceptors(
    FileInterceptor('featuredImage', {
      storage: memoryStorage(),
    }),
  )
  async create(
    @Body(new ValidationPipe()) createBlogDto: CreateBlogDto,
    @UploadedFile() featuredImage?: Express.Multer.File,
  ) {
    let featuredImageUrl: string | undefined;

    if (featuredImage) {
      const key = this.s3Service.generateFileKey(
        featuredImage.originalname,
        'blog',
      );

      featuredImageUrl = await this.s3Service.uploadFile({
        key,
        buffer: featuredImage.buffer,
        contentType: featuredImage.mimetype,
      });
    }

    return this.blogService.create({
      ...createBlogDto,
      featuredImage: featuredImageUrl,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update blog post by ID' })
  @ApiParam({ name: 'id', description: 'Blog post ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateBlogDto })
  @ApiBearerAuth()
  @ApiOkResponse({ type: BlogResponse })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  @ApiNotFoundResponse({ description: 'Blog post not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseInterceptors(
    FileInterceptor('featuredImage', {
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
    updateBlogDto: UpdateBlogDto,
    @UploadedFile() featuredImage?: Express.Multer.File,
  ) {
    // Get current blog post to access existing featured image
    const currentBlog = await this.blogService.findById(Number(id));
    if (!currentBlog) {
      throw new Error('Blog post not found');
    }

    let featuredImageUrl: string | undefined;

    if (featuredImage) {
      // Upload new image to S3
      const key = this.s3Service.generateFileKey(
        featuredImage.originalname,
        'blog',
      );

      featuredImageUrl = await this.s3Service.uploadFile({
        key,
        buffer: featuredImage.buffer,
        contentType: featuredImage.mimetype,
      });

      // Delete old image from S3 if it exists
      if (currentBlog.featuredImage) {
        try {
          const url = new URL(currentBlog.featuredImage);
          const oldKey = url.pathname.substring(1);
          await this.s3Service.deleteFile({ key: oldKey });
        } catch (error) {
          console.warn(
            `Failed to delete old featured image: ${currentBlog.featuredImage}`,
            error,
          );
        }
      }
    }

    return this.blogService.update(Number(id), {
      ...updateBlogDto,
      ...(featuredImageUrl && { featuredImage: featuredImageUrl }),
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete blog post by ID' })
  @ApiParam({ name: 'id', description: 'Blog post ID' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Blog post deleted successfully' })
  @ApiNotFoundResponse({ description: 'Blog post not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async delete(@Param('id') id: string) {
    return this.blogService.delete(Number(id));
  }
}
