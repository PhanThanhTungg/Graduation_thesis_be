import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsString()
  voucherCode?: string;
}

