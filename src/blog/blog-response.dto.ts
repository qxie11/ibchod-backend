import { ApiProperty } from '@nestjs/swagger';

export class BlogResponse {
  @ApiProperty({ description: 'ID статьи' })
  id!: number;

  @ApiProperty({ description: 'Заголовок статьи' })
  title!: string;

  @ApiProperty({ description: 'URL-слаг статьи' })
  slug!: string;

  @ApiProperty({ description: 'Содержание статьи' })
  content!: string;

  @ApiProperty({ description: 'Краткое описание статьи' })
  excerpt!: string;

  @ApiProperty({ description: 'Главное изображение', required: false })
  featuredImage?: string;

  @ApiProperty({ description: 'Теги статьи', type: [String] })
  tags!: string[];

  @ApiProperty({ description: 'Автор статьи' })
  author!: string;

  @ApiProperty({ description: 'Опубликована ли статья' })
  published!: boolean;

  @ApiProperty({ description: 'Дата публикации', required: false })
  publishedAt?: Date;

  @ApiProperty({ description: 'Количество просмотров' })
  viewCount!: number;

  @ApiProperty({ description: 'Дата создания' })
  createdAt!: Date;

  @ApiProperty({ description: 'Дата обновления' })
  updatedAt!: Date;
}

export class BlogListResponse {
  @ApiProperty({ description: 'Список статей', type: [BlogResponse] })
  items!: BlogResponse[];

  @ApiProperty({ description: 'Общее количество статей' })
  total!: number;

  @ApiProperty({ description: 'Количество пропущенных статей' })
  skip!: number;
}
