import { Controller, Post, Body, Query, ValidationPipe, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { ChatRequestDto, ChatResponseDto, GenerateTextRequestDto, GenerateTextResponseDto } from './dto/gemini.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('chat')
  async chat(@Body(ValidationPipe) chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    return await this.geminiService.chat(chatRequest);
  }

  @Post('generate')
  async generateText(@Body(ValidationPipe) generateRequest: GenerateTextRequestDto): Promise<GenerateTextResponseDto> {
    return await this.geminiService.generateText(generateRequest);
  }

  @Post('generate-multiple')
  async generateMultiple(
    @Body('prompt') prompt: string,
    @Query('count') count?: number
  ): Promise<{ responses: string[] }> {
    const responses = await this.geminiService.generateMultipleResponses(prompt, count || 3);
    return { responses };
  }

  // @Post('analyze-document')
  // @UseInterceptors(FileInterceptor('file'))
  // async analyzeDocument(
  //   @UploadedFile() file: Express.Multer.File,
  //   @Body('prompt') prompt: string
  // ): Promise<{ analysis: string }> {
  //   const documentBase64 = file.buffer.toString('base64');
  //   const analysis = await this.geminiService.analyzeDocument(documentBase64, prompt, file.mimetype);
  //   return { analysis };
  // }
}
