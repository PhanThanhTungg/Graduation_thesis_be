import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateNoteDto } from './dto/note.dto';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { successResponse } from 'src/common/interfaces/response.interface';
import { NoteResponse } from 'src/common/interfaces/noteResponse.interface';

@Injectable()
export class NoteService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new note for a lesson
   * @param user - Current authenticated user
   * @param dto - Note creation data
   */
  async createNote(user: currentClientUser, dto: CreateNoteDto) {
    try {
      // Verify lesson exists
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: dto.lessonId },
        select: { id: true },
      });

      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }

      const note = await this.prisma.note.create({
        data: {
          userId: user.id,
          lessonId: dto.lessonId,
          content: dto.content,
          timestamp: dto.timestamp,
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              slug: true,
              chapter: {
                select: {
                  course: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const response: successResponse = {
        message: 'Note created successfully',
        data: note,
      };
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create note');
    }
  }

  /**
   * Get all notes of a user for a specific lesson
   * Optimized: Single query to get notes with lesson info
   * @param user - Current authenticated user
   * @param lessonId - The lesson ID
   */
  async getUserNotesByLesson(user: currentClientUser, lessonId: string) {
    const notes = await this.prisma.note.findMany({
      where: {
        lessonId,
        userId: user.id,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // If no notes found, verify lesson exists to give proper error
    if (notes.length === 0) {
      const lessonExists = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true },
      });

      if (!lessonExists) {
        throw new NotFoundException('Lesson not found');
      }
    }

    const response: successResponse = {
      message: 'Notes retrieved successfully',
      data: {
        lesson:
          notes.length > 0
            ? {
                id: notes[0].lesson.id,
                title: notes[0].lesson.title,
              }
            : null,
        notes: notes.map(({ lesson, ...note }) => note),
      },
    };
    return response;
  }

  async getUserNotesByCourse(user: currentClientUser, courseId: string) {
    const notes = await this.prisma.note.findMany({
      where: {
        userId: user.id,
        lesson: {
          chapter: {
            courseId: courseId,
          },
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    // If no notes found, verify course exists to give proper error
    if (notes.length === 0) {
      const courseExists = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true },
      });

      if (!courseExists) {
        throw new NotFoundException('Course not found');
      }
    }

    const lessonMap = new Map<string, NoteResponse>();
    notes.forEach(({ lesson, lessonId, userId, ...note }) => {
      if (!lessonMap.has(lesson.id)) {
        lessonMap.set(lesson.id, {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonSlug: lesson.slug,
          notes: [],
        });
      }
      lessonMap.get(lesson.id)!.notes.push(note);
    });

    const response: successResponse = {
      message: 'Notes retrieved successfully',
      data: {
        lessons: Array.from(lessonMap.values()),
      },
    };
    return response;
  }

  /**
   * Update a note
   * Optimized: Single query with userId in where clause for ownership check
   * @param user - Current authenticated user
   * @param noteId - The note ID
   * @param dto - Note update data
   */
  async updateNote(user: currentClientUser, noteId: string, dto: any) {
    try {
      const updatedNote = await this.prisma.note.update({
        where: {
          id: noteId,
          userId: user.id, // Ownership check in same query
        },
        data: {
          ...(dto.content !== undefined && { content: dto.content }),
          ...(dto.timestamp !== undefined && { timestamp: dto.timestamp }),
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });

      const response: successResponse = {
        message: 'Note updated successfully',
        data: updatedNote,
      };
      return response;
    } catch (error) {
      // Prisma P2025: Record not found (either note doesn't exist or user doesn't own it)
      if (error.code === 'P2025') {
        throw new NotFoundException(
          'Note not found or you do not have permission to update it',
        );
      }
      throw new BadRequestException('Failed to update note');
    }
  }

  /**
   * Delete a note
   * Optimized: Single query with userId in where clause for ownership check
   * @param user - Current authenticated user
   * @param noteId - The note ID
   */
  async deleteNote(user: currentClientUser, noteId: string) {
    try {
      await this.prisma.note.delete({
        where: {
          id: noteId,
          userId: user.id, // Ownership check in same query
        },
      });

      const response: successResponse = {
        message: 'Note deleted successfully',
        data: null,
      };
      return response;
    } catch (error) {
      // Prisma P2025: Record not found (either note doesn't exist or user doesn't own it)
      if (error.code === 'P2025') {
        throw new NotFoundException(
          'Note not found or you do not have permission to delete it',
        );
      }
      throw new BadRequestException('Failed to delete note');
    }
  }
}
