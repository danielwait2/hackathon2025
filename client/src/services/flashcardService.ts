import { apiClient } from "./api";
import { Flashcard } from "../contexts/FlashcardContext";

class FlashcardService {
  async getFlashcards(): Promise<Flashcard[]> {
    const response = await apiClient.get<Flashcard[]>("/flashcards");
    return response.data;
  }

  async getFlashcardsForNote(noteId: number): Promise<Flashcard[]> {
    const response = await apiClient.get<Flashcard[]>(
      `/flashcards/note/${noteId}`
    );
    return response.data;
  }

  async createFlashcard(
    question: string,
    answer: string,
    noteId?: number
  ): Promise<Flashcard> {
    const response = await apiClient.post<Flashcard>("/flashcards", {
      question,
      answer,
      note_id: noteId,
    });
    return response.data;
  }

  async getFlashcardById(id: number): Promise<Flashcard> {
    const response = await apiClient.get<Flashcard>(`/flashcards/${id}`);
    return response.data;
  }

  async updateFlashcard(
    id: number,
    question: string,
    answer: string
  ): Promise<void> {
    await apiClient.put(`/flashcards/${id}`, { question, answer });
  }

  async deleteFlashcard(id: number): Promise<void> {
    await apiClient.delete(`/flashcards/${id}`);
  }

  async bulkDeleteFlashcards(flashcardIds: number[]): Promise<void> {
    try {
      await apiClient.delete("/flashcards/bulk", {
        data: { flashcardIds },
      });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to delete flashcards"
      );
    }
  }
}

export const flashcardService = new FlashcardService();
