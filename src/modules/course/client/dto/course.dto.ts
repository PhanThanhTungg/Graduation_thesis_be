import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class CourseDescriptionDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The headline of the course',
    example: 'Learn advanced C++ programming',
    required: false,
  })
  headline?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Target knowledges (comma-separated)',
    example: 'OOP &&& Templates && STL',
    required: false,
  })
  targetKnowledges?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Course requirements',
    example: 'Basic C++ knowledge required',
    required: false,
  })
  requirement?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Detailed course description',
    example: 'This course covers advanced C++ topics...',
    required: false,
  })
  detail?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Suitable participants (comma-separated)',
    example: 'Intermediate developers, Software engineers',
    required: false,
  })
  suitableParticipant?: string;
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

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The teacher ID of the course',
    example: 'uuid-string',
  })
  teacherId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The price of the course',
    example: '99.99',
  })
  price: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The category ID of the course',
    example: 'uuid-string',
  })
  categoryId: string;
}