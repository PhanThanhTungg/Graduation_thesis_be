import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ClientAuthService } from 'src/modules/auth/client/client-auth.service';
import { QuestionService } from 'src/modules/question/client/question-client.service';
import { ClientSettingService } from 'src/modules/setting/client/client-setting.service';
import { Model } from 'src/modules/question/client/dto/generate.dto';
import { EnvService } from 'src/shared/env/env.service';
import * as TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {
  private bot: typeof TelegramBot;

  constructor(
    private readonly envService: EnvService,
    private readonly clientAuthService: ClientAuthService,
    @Inject(forwardRef(() => QuestionService))
    private readonly questionService: QuestionService,
    private readonly clientSettingService: ClientSettingService,
  ) {
    this.bot = new TelegramBot(envService.get('TELE_BOT_TOKEN'), {
      webhook: true,
    });
    this.bot.setWebHook(`${envService.get('DEPLOY_URL')}/api/telegram/webhook`);
  }

  async handleUpdate(message: any) {
    if (message && message.text) {
      const chatId = message.chat.id;
      const text = message.text;
      try {
        if (text.startsWith('/start')) {
          const userId = text.split(' ')[1];
          const checkUser = await this.clientAuthService.checkUserById(userId);
          if (checkUser) {
            await this.clientSettingService.setTelegramId(
              chatId + '',
              checkUser.id,
            );
            this.sendMessage(
              chatId,
              `<b>Connected successfully!</b>\n\n` +
                `<b>ID:</b> <code>${checkUser.id}</code>\n`,
            );
          } else {
            this.sendMessage(chatId, `🚫 <code>account not found</code>`);
          }
        } else {
          const user = await this.clientAuthService.findUserByTelegramId(
            chatId + '',
          );
          if (!user) {
            this.sendMessage(
              chatId,
              `🚫 <code>you are not connected to the account</code>`,
            );
            return;
          }
          const reply = message.reply_to_message;
          if (!reply) {
            this.sendMessage(
              chatId,
              '🚫 <code>please answer a question, do not send free messages</code>',
            );
          } else {
            const questionId = reply.text.split('\n').pop()?.trim();
            if (!questionId) {
              this.sendMessage(
                chatId,
                '🚫 <code>question id not found in replied message</code>',
              );
              return;
            }

            try {
              const result = await this.questionService.answerQuestion(
                questionId,
                {
                  answer: text,
                  model: Model.GROQ,
                } as any,
                user.id,
              );
              const data = result?.data ?? result;

              this.sendMessage(
                chatId,
                `<b>Score:</b> ${data.score}\n<b>Explain:</b> ${data.explain}\n<b>AI Feedback:</b> ${data.aiFeedback}`,
              );
            } catch (error) {
              this.sendMessage(
                chatId,
                `🚫 <code>failed to answer question: ${error.message}</code>`,
              );
            }
          }
        }
      } catch (error) {
        this.sendMessage(chatId, `🚫 <code>error: ${error.message}</code>`);
      }
    }
  }

  async sendMessage(chatId: string, message: string) {
    try {
      await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (error) {
      console.log(error);
    }
  }
}
