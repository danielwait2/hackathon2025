import { apiClient } from "./api";
import { Note } from "../contexts/FlashcardContext";

class NoteService {
  async getNotes(): Promise<Note[]> {
    const response = await apiClient.get<Note[]>("/notes");
    return response.data;
  }

  async getNoteById(id: number): Promise<Note> {
    const response = await apiClient.get<Note>(`/notes/${id}`);
    return response.data;
  }

  async createNote(
    content: string,
    title?: string,
    topic?: string
  ): Promise<Note> {
    const response = await apiClient.post<Note>("/notes", {
      content,
      title,
      topic,
    });
    return response.data;
  }

  async updateNote(
    id: number,
    content?: string,
    title?: string,
    topic?: string
  ): Promise<void> {
    await apiClient.put(`/notes/${id}`, {
      content,
      title,
      topic,
    });
  }

  async deleteNote(id: number): Promise<void> {
    await apiClient.delete(`/notes/${id}`);
  }

  async generateFlashcards(noteId: number): Promise<any[]> {
    const response = await apiClient.post<{ flashcards: any[] }>(
      `/notes/${noteId}/generate-flashcards`
    );
    return response.data.flashcards;
  }
}

export const noteService = new NoteService();
