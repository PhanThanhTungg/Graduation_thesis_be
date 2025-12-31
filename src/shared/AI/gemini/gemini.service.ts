import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
  GenerateTextRequestDto,
  GenerateTextResponseDto,
} from './dto/gemini.dto';
import { EnvService } from 'src/shared/env/env.service';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private defaultModel: string = 'gemini-2.0-flash-lite';

  constructor(private envService: EnvService) {
    this.genAI = new GoogleGenerativeAI(this.envService.get('GEMINI_API_KEY'));
  }
  async generateContent(
    generateRequest: GenerateTextRequestDto,
  ): Promise<GenerateTextResponseDto> {
    const modelName = generateRequest.model || this.defaultModel;
    const model: GenerativeModel = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens:
          generateRequest.maxTokens || +this.envService.get('GEMINI_MAX_TOKEN'),
        temperature:
          generateRequest.temperature ||
          +this.envService.get('GEMINI_TEMPERATURE'),
      },
    });

    let content: any;

    if (generateRequest.files && generateRequest.files.length > 0) {
      const parts: any[] = [{ text: generateRequest.prompt }];

      for (const file of generateRequest.files) {
        if ('data' in file) {
          parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.data,
            },
          });
        } else if ('fileUri' in file) {
          parts.push({
            fileData: {
              mimeType: file.mimeType,
              fileUri: file.fileUri,
            },
          });
        }
      }

      content = parts;
    } else {
      content = generateRequest.prompt;
    }

    const result = await model.generateContent(content);
    const response = await result.response;
    const text = response.text();

    return {
      text,
      model: modelName,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      },
    };
  }
}
