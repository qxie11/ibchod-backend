import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponse {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  smartphoneId!: number;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  orderId!: number;
}

export class OrderResponse {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  checked!: boolean;

  @ApiProperty({ type: [OrderItemResponse] })
  items!: OrderItemResponse[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class OrderListResponse {
  @ApiProperty({ type: [OrderResponse] })
  data!: OrderResponse[];

  @ApiProperty()
  total!: number;
}
