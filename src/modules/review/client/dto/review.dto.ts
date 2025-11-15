import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Rating from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  rating: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Review comment',
    example: 'This is an excellent course! I learned a lot.',
    required: false,
  })
  comment?: string;
}

export class UpdateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  @ApiProperty({
    description: 'Rating from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  rating?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Review comment',
    example: 'Updated review comment.',
    required: false,
  })
  comment?: string;
}

export class CreateReviewReplyDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Reply comment',
    example: 'Thank you for your feedback!',
  })
  comment: string;
}
