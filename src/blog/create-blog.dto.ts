import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateBlogDto {
  @ApiProperty({ description: 'Заголовок статьи' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'URL-слаг статьи' })
  @IsString()
  slug!: string;

  @ApiProperty({ description: 'Содержание статьи' })
  @IsString()
  content!: string;

  @ApiProperty({ description: 'Краткое описание статьи', required: false })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiProperty({ description: 'Теги статьи', type: [String], required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'Автор статьи', required: false })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({ description: 'Опубликована ли статья', required: false })
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @ApiProperty({ description: 'Главное изображение', required: false })
  @IsString()
  @IsOptional()
  featuredImage?: string;
}
