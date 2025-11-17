import { IsString } from 'class-validator';

export class CaptureOrderDto {
  @IsString()
  paypalOrderId: string;
}

