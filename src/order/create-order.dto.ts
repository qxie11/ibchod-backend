import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty()
  @IsInt()
  smartphoneId!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name!: string;

  @IsOptional()
  @ApiProperty({ required: false })
  id?: number;

  @IsOptional()
  @ApiProperty({ required: false })
  checked?: boolean;

  @IsOptional()
  @ApiProperty({ required: false })
  createdAt?: Date;

  @IsOptional()
  @ApiProperty({ required: false })
  updatedAt?: Date;

  @IsString()
  @IsOptional()
  @ApiProperty()
  message!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ApiProperty()
  items!: OrderItemDto[];
}
