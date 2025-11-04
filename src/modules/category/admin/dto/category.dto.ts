import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty} from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The title of the category',
    example: 'Programming',
  })
  title: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The parent category id',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  parentId?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}