import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Lesson ID',
    example: 'uuid-string',
  })
  lessonId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Note content',
    example: 'This is an important concept to remember',
  })
  content: string;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Timestamp in seconds on the video',
    example: 125,
    minimum: 0,
  })
  timestamp: number;
}

export class UpdateNoteDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Note content',
    example: 'Updated note content',
    required: false,
  })
  content?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiProperty({
    description: 'Timestamp in seconds on the video',
    example: 150,
    minimum: 0,
    required: false,
  })
  timestamp?: number;
}
