import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ChatRequestDto, ChatResponseDto, GenerateTextRequestDto, GenerateTextResponseDto } from './dto/gemini.dto';
import { EnvService } from 'src/shared/env/env.service';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private defaultModel: string = 'gemini-2.0-flash-lite';

  constructor(private readonly env: EnvService) {
    const apiKey = this.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async chat(chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      const model: GenerativeModel = this.genAI.getGenerativeModel({ model: this.defaultModel });
      console.log(chatRequest.prompt);
      const result = await model.generateContent(chatRequest.prompt);
      console.log(result);
      const response = await result.response;
      const text = response.text();

      return {
        response: text,
        model: this.defaultModel,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        }
      };
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new InternalServerErrorException('Failed to generate response from Gemini API');
    }
  }

  async generateText(generateRequest: GenerateTextRequestDto): Promise<GenerateTextResponseDto> {
    try {
      const modelName = generateRequest.model || this.defaultModel;
      const model: GenerativeModel = this.genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          maxOutputTokens: generateRequest.maxTokens || this.env.get('GEMINI_MAX_TOKEN') as number,
          temperature: generateRequest.temperature || this.env.get('GEMINI_TEMPERATURE'),
        }
      });

      const result = await model.generateContent(generateRequest.prompt);
      const response = await result.response;
      const text = response.text();

      return {
        text,
        model: modelName,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        }
      };
    } catch (error) {
      console.error('Error generating text with Gemini API:', error);
      throw new InternalServerErrorException('Failed to generate text from Gemini API');
    }
  }

  async generateMultipleResponses(prompt: string, count: number = 3): Promise<string[]> {
    try {
      const model: GenerativeModel = this.genAI.getGenerativeModel({ model: this.defaultModel });
      const responses: string[] = [];

      for (let i = 0; i < count; i++) {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        responses.push(response.text());
      }

      return responses;
    } catch (error) {
      console.error('Error generating multiple responses:', error);
      throw new InternalServerErrorException('Failed to generate multiple responses');
    }
  }

  async analyzeDocument(documentBase64: string, prompt: string, mimeType: string): Promise<string> {
    try {
      const model: GenerativeModel = this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
      
      const imagePart = {
        inlineData: {
          data: documentBase64,
          mimeType: mimeType
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new InternalServerErrorException('Failed to analyze image');
    }
  }
}
