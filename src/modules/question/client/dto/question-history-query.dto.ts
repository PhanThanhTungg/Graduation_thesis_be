import {
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum SortByField {
  DATE = 'date',
  SCORE = 'score',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QuestionHistoryQueryDto {
  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isForReview?: boolean;

  @ApiProperty({
    required: false,
    enum: SortByField,
    default: SortByField.DATE,
  })
  @IsOptional()
  @IsEnum(SortByField)
  sortBy?: SortByField = SortByField.DATE;

  @ApiProperty({ required: false, enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
