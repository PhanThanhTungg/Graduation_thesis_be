import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min, ValidateNested } from "class-validator";

export class CourseDescriptionDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The headline of the course',
    example: 'Learn advanced C++ programming',
    required: false,
  })
  headline?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    description: 'Target knowledges',
    example: '["OOP", "Templates", "STL"]',
    required: false,
  })
  targetKnowledges?: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    description: 'Course requirements',
    example: '["Basic C++ knowledge required", "python knowledge required"]',
    required: false,
  })
  requirement?: string[] = [];

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Detailed course description',
    example: 'This course covers advanced C++ topics...',
    required: false,
  })
  detail?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    description: 'Suitable participants',
    example: '["Intermediate developers", "Software engineers"]',
    required: false,
  })
  suitableParticipant?: string[] = [];
}

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The title of the course',
    example: 'C++ advanced by tung',
  })
  title: string;

  @IsUrl()
  @IsOptional()
  @ApiProperty({
    description: 'The thumbnail URL of the course',
    example: 'https://example.com/thumbnail.jpg',
    required: false,
  })
  thumbnailUrl?: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The price of the course',
    example: 99.99,
  })
  price: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The category ID of the course',
    example: 'uuid-string',
  })
  categoryId: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: 'The is published of the course',
    example: false,
    required: false,
    default: false
  })
  isPublished?: boolean;

  @ValidateNested()
  @Type(() => CourseDescriptionDto)
  @ApiProperty({
    description: 'The course description',
    type: CourseDescriptionDto,
  })
  courseDescription: CourseDescriptionDto;
}