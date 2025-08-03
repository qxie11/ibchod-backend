import { ApiProperty } from '@nestjs/swagger';

export class SmartphoneResponse {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  color!: string;

  @ApiProperty()
  capacity!: number;

  @ApiProperty()
  price!: number;

  @ApiProperty({ type: [String] })
  gallery!: string[];

  @ApiProperty({ required: false })
  large_desc?: string;

  @ApiProperty({ required: false })
  small_desc?: string;

  @ApiProperty()
  active!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class SmartphoneListResponse {
  @ApiProperty({ type: [SmartphoneResponse] })
  data!: SmartphoneResponse[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  skip!: number;

  @ApiProperty()
  take!: number;
}

export class FiltersResponse {
  @ApiProperty({ type: [String] })
  colors!: string[];

  @ApiProperty({ type: [Number] })
  capacities!: number[];

  @ApiProperty()
  minPrice!: number;

  @ApiProperty()
  maxPrice!: number;
} 