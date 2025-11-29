import { Note } from '@prisma/client';

export interface NoteResponse {
  lessonId: string;
  lessonTitle: string;
  lessonSlug: string;
  notes: Omit<Note, 'lessonId' | 'userId'>[];
}
