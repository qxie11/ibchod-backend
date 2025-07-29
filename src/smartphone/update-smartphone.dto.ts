import {
  IsString,
  IsNumber,
  Min,
  IsArray,
  IsString as IsStringArray,
  IsOptional,
} from 'class-validator';
import { IsFile } from '../common/decorators/is-file.decorator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSmartphoneDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  slug?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  color?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(64)
  @IsOptional()
  @ApiProperty({ required: false })
  capacity?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty({ required: false })
  price?: number;

  @IsArray()
  @IsStringArray({ each: true })
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
  active?: string;
}
