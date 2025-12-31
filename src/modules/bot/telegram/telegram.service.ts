import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ClientAuthService } from 'src/modules/auth/client/client-auth.service';
import { QuestionService } from 'src/modules/question/client/question-client.service';
import { ClientSettingService } from 'src/modules/setting/client/client-setting.service';
import { EnvService } from 'src/shared/env/env.service';
import * as TelegramBot from 'node-telegram-bot-api';
import { AiModel } from '@prisma/client';
import { SprSettingDto } from 'src/modules/auth/client/dto/spr-setting.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class TelegramService {
  private bot: typeof TelegramBot;

  constructor(
    private readonly envService: EnvService,
    private readonly clientAuthService: ClientAuthService,
    @Inject(forwardRef(() => QuestionService))
    private readonly questionService: QuestionService,
    private readonly clientSettingService: ClientSettingService,
    private readonly prisma: PrismaService,
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
          await this.handleStartCommand(chatId, userId);
        } else {
          const user = await this.clientAuthService.findUserByTelegramId(
            chatId + '',
          );
          if (!user) {
            this.sendMessage(chatId, `🚫 <code>account not found</code>`);
            return;
          }
          const userSetting = await this.clientSettingService.getSettingsByType(
            'spr',
            user.id,
          );
          if (!userSetting) {
            this.sendMessage(
              chatId,
              `🚫 <code>you are not connected to the account</code>`,
            );
            return;
          }
          if (!userSetting.data.enabledSpr) {
            this.sendMessage(chatId, `🚫 <code>SPR is not enabled</code>`);
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
            await this.handleAnswerQuestion(
              chatId,
              user.id,
              questionId,
              text,
              userSetting.data,
            );
          }
        }
      } catch (error) {
        this.sendMessage(chatId, `🚫 <code>error: ${error.message}</code>`);
      }
    }
  }

  private async handleAnswerQuestion(
    chatId: string,
    userId: string,
    questionId: string,
    answer: string,
    userSetting: SprSettingDto,
  ) {
    if (!questionId) {
      this.sendMessage(
        chatId,
        '🚫 <code>question id not found in replied message</code>',
      );
      return;
    }

    const question = await this.questionService.getQuestion(questionId, userId);
    if (!question) {
      this.sendMessage(chatId, `🚫 <code>question not found</code>`);
      return;
    }
    if (question.answer) {
      this.sendMessage(chatId, `🚫 <code>question already answered</code>`);
      return;
    }

    try {
      const result = await this.questionService.answerQuestion(
        questionId,
        {
          answer,
          model: userSetting.sprModel,
        } as any,
        userId,
      );
      const data = result?.data ?? result;

      this.sendMessage(
        chatId,
        `<b>Score:</b> ${data.score}\n<b>Explain:</b> ${data.explain}\n<b>AI Feedback:</b> ${data.aiFeedback}`,
      );
      await this.questionService.scoreQuestionForSpr(questionId, userId);
      await this.prisma.lessonReviewSetting.update({
        where: {
          lessonId: question.lessonId,
          userId,
        },
        data: {
          lastReviewedAt: new Date(),
        },
      });
    } catch (error) {
      console.log('error', error);
      this.sendMessage(
        chatId,
        `🚫 <code>failed to answer question: ${error.message}</code>`,
      );
    }
  }

  private async handleStartCommand(chatId: string, userId: string) {
    const checkUser = await this.clientAuthService.checkUserById(userId);
    if (checkUser) {
      await this.clientSettingService.setTelegramId(chatId + '', checkUser.id);
      this.sendMessage(
        chatId,
        `<b>Connected successfully!</b>\n\n` +
          `<b>ID:</b> <code>${checkUser.id}</code>\n`,
      );
    } else {
      this.sendMessage(chatId, `🚫 <code>account not found</code>`);
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
