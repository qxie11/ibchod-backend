import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
} from 'class-validator';
import { IsFile } from '../common/decorators/is-file.decorator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSmartphoneDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  slug!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  color!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(64)
  @ApiProperty()
  capacity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiProperty()
  price!: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsOptional()
  @IsFile(
    { mime: ['image/jpg', 'image/png', 'image/jpeg', 'image/webp'] },
    { message: 'Each file in gallery must be a valid image' },
  )
  @ApiProperty({ required: false })
  gallery?: any;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  large_desc?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  small_desc?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  active?: boolean;

  @IsOptional()
  @ApiProperty({ required: false })
  id?: number;

  @IsOptional()
  @ApiProperty({ required: false })
  createdAt?: Date;

  @IsOptional()
  @ApiProperty({ required: false })
  updatedAt?: Date;
}
