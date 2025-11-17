import { Module } from '@nestjs/common';
import { NoteController } from './note-client.controller';
import { NoteService } from './note-client.service';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NoteController],
  providers: [NoteService],
  exports: [NoteService],
})
export class NoteClientModule {}
