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

export class CreateSmartphoneDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  // slug должен быть уникальным
  slug!: string;

  @IsString()
  @IsNotEmpty()
  color!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(64)
  capacity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsOptional()
  @IsFile(
    { mime: ['image/jpg', 'image/png', 'image/jpeg', 'image/webp'] },
    { message: 'Each file in gallery must be a valid image' },
  )
  gallery?: any;
}
