import { 
  Body, 
  Controller, 
  Delete,
  Get,
  Param, 
  Patch,
  Post,
  UseGuards 
} from '@nestjs/common';
import { NoteService } from './note-client.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';

@Controller('note')
@ApiTags('Client / Note')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  @UseGuards(AuthGuard('client-jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new note for a lesson',
  })
  async createNote(
    @CurrentUser() user: currentClientUser,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.noteService.createNote(user, createNoteDto);
  }

  @Get('lesson/:lessonId')
  @UseGuards(AuthGuard('client-jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all notes of the current user for a specific lesson',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'The UUID of the lesson',
    example: 'uuid-string',
  })
  async getUserNotesByLesson(
    @CurrentUser() user: currentClientUser,
    @Param('lessonId') lessonId: string,
  ) {
    return this.noteService.getUserNotesByLesson(user, lessonId);
  }

  @Get('course/:courseId')
  @UseGuards(AuthGuard('client-jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all notes of the current user for a specific course',
  })
  @ApiParam({
    name: 'courseId',
    description: 'The UUID of the course',
    example: 'uuid-string',
  })
  async getUserNotesByCourse(
    @CurrentUser() user: currentClientUser,
    @Param('courseId') courseId: string,
  ) {
    return this.noteService.getUserNotesByCourse(user, courseId);
  }

  @Patch(':noteId')
  @UseGuards(AuthGuard('client-jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a note (only owner can update)',
  })
  @ApiParam({
    name: 'noteId',
    description: 'The UUID of the note',
    example: 'uuid-string',
  })
  async updateNote(
    @CurrentUser() user: currentClientUser,
    @Param('noteId') noteId: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    return this.noteService.updateNote(user, noteId, updateNoteDto);
  }

  @Delete(':noteId')
  @UseGuards(AuthGuard('client-jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a note (only owner can delete)',
  })
  @ApiParam({
    name: 'noteId',
    description: 'The UUID of the note',
    example: 'uuid-string',
  })
  async deleteNote(
    @CurrentUser() user: currentClientUser,
    @Param('noteId') noteId: string,
  ) {
    return this.noteService.deleteNote(user, noteId);
  }
}
