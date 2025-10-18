import { apiClient } from "./api";

class AnkiService {
  async checkConnection(): Promise<boolean> {
    const response = await apiClient.get<{ connected: boolean }>(
      "/anki/connection"
    );
    return response.data.connected;
  }

  async getAnkiDecks(): Promise<string[]> {
    const response = await apiClient.get<string[]>("/anki/decks");
    return response.data;
  }

  async pushToAnki(flashcardIds: number[], deckName: string): Promise<void> {
    await apiClient.post("/anki/push", {
      flashcardIds,
      deckName,
    });
  }

  async pushNoteToAnki(noteId: number, deckName: string): Promise<void> {
    await apiClient.post(`/anki/push-note/${noteId}`, {
      deckName,
    });
  }
}

export const ankiService = new AnkiService();
