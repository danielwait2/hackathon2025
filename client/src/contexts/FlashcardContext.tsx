import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { flashcardService } from "../services/flashcardService";
import { noteService } from "../services/noteService";
import { ankiService } from "../services/ankiService";

export interface Note {
  id: number;
  content: string;
  title?: string;
  topic?: string;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  is_generated: boolean;
  note_id?: number;
  note_title?: string;
  created_at: string;
  updated_at: string;
}

interface FlashcardContextType {
  notes: Note[];
  flashcards: Flashcard[];
  loading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  fetchFlashcards: () => Promise<void>;
  fetchFlashcardsForNote: (noteId: number) => Promise<Flashcard[]>;
  createNote: (
    content: string,
    title?: string,
    topic?: string
  ) => Promise<Note>;
  createFlashcard: (
    question: string,
    answer: string,
    noteId?: number
  ) => Promise<Flashcard>;
  updateFlashcard: (
    id: number,
    question: string,
    answer: string
  ) => Promise<void>;
  deleteFlashcard: (id: number) => Promise<void>;
  generateFlashcards: (noteId: number) => Promise<Flashcard[]>;
  bulkDeleteFlashcards: (flashcardIds: number[]) => Promise<void>;
  pushToAnki: (flashcardIds: number[], deckName: string) => Promise<void>;
  pushNoteToAnki: (noteId: number, deckName: string) => Promise<void>;
  getAnkiDecks: () => Promise<string[]>;
  checkAnkiConnection: () => Promise<boolean>;
}

const FlashcardContext = createContext<FlashcardContextType | undefined>(
  undefined
);

export const FlashcardProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedNotes = await noteService.getNotes();
      setNotes(fetchedNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFlashcards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedFlashcards = await flashcardService.getFlashcards();
      setFlashcards(fetchedFlashcards);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch flashcards"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFlashcardsForNote = useCallback(async (noteId: number) => {
    try {
      setError(null);
      const noteFlashcards = await flashcardService.getFlashcardsForNote(
        noteId
      );
      return noteFlashcards;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch flashcards for note"
      );
      throw err;
    }
  }, []);

  const createNote = useCallback(
    async (content: string, title?: string, topic?: string) => {
      try {
        setError(null);
        const newNote = await noteService.createNote(content, title, topic);
        setNotes((prev) => [newNote, ...prev]);
        return newNote;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create note");
        throw err;
      }
    },
    []
  );

  const createFlashcard = useCallback(
    async (question: string, answer: string, noteId?: number) => {
      try {
        setError(null);
        const newFlashcard = await flashcardService.createFlashcard(
          question,
          answer,
          noteId
        );
        setFlashcards((prev) => [newFlashcard, ...prev]);
        return newFlashcard;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create flashcard"
        );
        throw err;
      }
    },
    []
  );

  const updateFlashcard = useCallback(
    async (id: number, question: string, answer: string) => {
      try {
        setError(null);
        await flashcardService.updateFlashcard(id, question, answer);
        setFlashcards((prev) =>
          prev.map((flashcard) =>
            flashcard.id === id
              ? {
                  ...flashcard,
                  question,
                  answer,
                  updated_at: new Date().toISOString(),
                }
              : flashcard
          )
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update flashcard"
        );
        throw err;
      }
    },
    []
  );

  const deleteFlashcard = useCallback(async (id: number) => {
    try {
      setError(null);
      await flashcardService.deleteFlashcard(id);
      setFlashcards((prev) => prev.filter((flashcard) => flashcard.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete flashcard"
      );
      throw err;
    }
  }, []);

  const bulkDeleteFlashcards = useCallback(async (flashcardIds: number[]) => {
    try {
      setError(null);
      await flashcardService.bulkDeleteFlashcards(flashcardIds);
      setFlashcards((prev) =>
        prev.filter((flashcard) => !flashcardIds.includes(flashcard.id))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete flashcards"
      );
      throw err;
    }
  }, []);

  const generateFlashcards = useCallback(async (noteId: number) => {
    try {
      setError(null);
      const generatedFlashcards = await noteService.generateFlashcards(noteId);
      setFlashcards((prev) => [...generatedFlashcards, ...prev]);
      return generatedFlashcards;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate flashcards"
      );
      throw err;
    }
  }, []);

  const pushToAnki = useCallback(
    async (flashcardIds: number[], deckName: string) => {
      try {
        setError(null);
        await ankiService.pushToAnki(flashcardIds, deckName);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to push to Anki");
        throw err;
      }
    },
    []
  );

  const pushNoteToAnki = useCallback(
    async (noteId: number, deckName: string) => {
      try {
        setError(null);
        await ankiService.pushNoteToAnki(noteId, deckName);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to push note to Anki"
        );
        throw err;
      }
    },
    []
  );

  const getAnkiDecks = useCallback(async () => {
    try {
      setError(null);
      return await ankiService.getAnkiDecks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get Anki decks");
      throw err;
    }
  }, []);

  const checkAnkiConnection = useCallback(async () => {
    try {
      setError(null);
      return await ankiService.checkConnection();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check Anki connection"
      );
      return false;
    }
  }, []);

  const value = {
    notes,
    flashcards,
    loading,
    error,
    fetchNotes,
    fetchFlashcards,
    fetchFlashcardsForNote,
    createNote,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    bulkDeleteFlashcards,
    generateFlashcards,
    pushToAnki,
    pushNoteToAnki,
    getAnkiDecks,
    checkAnkiConnection,
  };

  return (
    <FlashcardContext.Provider value={value}>
      {children}
    </FlashcardContext.Provider>
  );
};

export const useFlashcards = () => {
  const context = useContext(FlashcardContext);
  if (context === undefined) {
    throw new Error("useFlashcards must be used within a FlashcardProvider");
  }
  return context;
};
