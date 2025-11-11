import { IsOptional, IsNumber, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCoursesDto {
  @ApiPropertyOptional({
    description: 'Filter by category IDs (comma-separated)',
    example: '1,2,3',
    type: String
  })
  @IsOptional()
  @IsString()
  categoryIds?: string;

  @ApiPropertyOptional({
    description: 'Filter by ratings (comma-separated). Values: 1-5',
    example: '4,5',
    type: String
  })
  @IsOptional()
  @IsString()
  ratings?: string;

  @ApiPropertyOptional({
    description: 'Minimum price',
    example: 0,
    type: Number
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceFrom?: number;

  @ApiPropertyOptional({
    description: 'Maximum price',
    example: 1000,
    type: Number
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceTo?: number;

  @ApiPropertyOptional({
    description: 'Search by course name or description',
    example: 'web development',
    type: String
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
    type: Number
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    type: Number
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'createdAt',
    enum: ['createdAt', 'price', 'rating', 'title'],
    default: 'createdAt'
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC'
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
