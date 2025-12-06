import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';
import {
  GenerateTextRequestDto,
  GenerateTextResponseDto,
} from './dto/groq.dto';
import { EnvService } from 'src/shared/env/env.service';

@Injectable()
export class GroqService {
  private groq: Groq;
  private defaultModel: string = 'llama-3.3-70b-versatile';

  constructor(private envService: EnvService) {
    this.groq = new Groq({
      apiKey: this.envService.get('GROQ_API_KEY'),
    });
  }

  async generateContent(
    generateRequest: GenerateTextRequestDto,
  ): Promise<GenerateTextResponseDto> {
    const modelName = generateRequest.model || this.defaultModel;

    const chatCompletion = await this.groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: generateRequest.prompt,
        },
      ],
      model: modelName,
      max_tokens:
        generateRequest.maxTokens || +this.envService.get('GROQ_MAX_TOKEN'),
      temperature:
        generateRequest.temperature || +this.envService.get('GROQ_TEMPERATURE'),
    });

    const text = chatCompletion.choices[0]?.message?.content || '';

    return {
      text,
      model: modelName,
      usage: {
        promptTokens: chatCompletion.usage?.prompt_tokens || 0,
        completionTokens: chatCompletion.usage?.completion_tokens || 0,
        totalTokens: chatCompletion.usage?.total_tokens || 0,
      },
    };
  }
}
