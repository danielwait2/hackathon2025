import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Save, AutoAwesome } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useFlashcards, Note } from "../contexts/FlashcardContext";

const NotesInput: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createNote, generateFlashcards, loading, error, notes } =
    useFlashcards();
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    content: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const topicOptions = [
    "General",
    "Science",
    "History",
    "Math",
    "Literature",
    "Programming",
    "Language",
    "Other",
  ];

  // Handle editing existing notes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const noteId = urlParams.get("noteId");

    if (noteId) {
      const note = notes.find((n) => n.id === parseInt(noteId));
      if (note) {
        setEditingNote(note);
        setFormData({
          title: note.title || "",
          topic: note.topic || "",
          content: note.content || "",
        });
      }
    }
  }, [location.search, notes]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTopicChange = (e: any) => {
    setFormData((prev) => ({ ...prev, topic: e.target.value }));
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    try {
      await createNote(
        formData.content,
        formData.title || undefined,
        formData.topic || undefined
      );
      navigate("/dashboard");
    } catch (err) {
      console.error("Error saving note:", err);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!formData.content.trim()) {
      setGenerationError("Please provide some content to generate flashcards.");
      return;
    }
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const newNote = await createNote(
        formData.content,
        formData.title || undefined,
        formData.topic || undefined
      );
      await generateFlashcards(newNote.id);
      navigate("/flashcards"); // Redirect to flashcards page after generation
    } catch (err: any) {
      console.error("Error generating flashcards:", err);
      setGenerationError(
        err.message || "Failed to generate flashcards. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {editingNote ? "Edit Note" : "Input Your Notes"}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          mb={4}
        >
          Paste your study material below to generate Anki flashcards.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        {generationError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {generationError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSaveNote}>
          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
            gap={3}
            mb={3}
          >
            <TextField
              fullWidth
              label="Note Title (Optional)"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={loading || isGenerating}
              placeholder="e.g., Biology Chapter 5"
            />
            <FormControl fullWidth>
              <InputLabel>Topic (Optional)</InputLabel>
              <Select
                value={formData.topic}
                label="Topic (Optional)"
                onChange={handleTopicChange}
                disabled={loading || isGenerating}
              >
                {topicOptions.map((topic) => (
                  <MenuItem key={topic} value={topic}>
                    {topic}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={12}
            label="Note Content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            disabled={loading || isGenerating}
            placeholder="Paste your study material here... 

Example:
Photosynthesis is the process by which plants convert light energy into chemical energy. The process occurs in two main stages: the light-dependent reactions and the Calvin cycle. During the light-dependent reactions, chlorophyll absorbs light energy and converts it into ATP and NADPH. The Calvin cycle uses these products to convert carbon dioxide into glucose."
            required
            helperText="The more detailed your notes, the better the AI can generate relevant flashcards"
            sx={{ mb: 3 }}
          />

          <Box mt={3} display="flex" gap={2} justifyContent="center">
            <Button
              type="submit"
              variant="outlined"
              startIcon={<Save />}
              disabled={loading || isGenerating || !formData.content.trim()}
            >
              {editingNote ? "Update Note" : "Save Note"}
            </Button>
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={handleGenerateFlashcards}
              disabled={loading || isGenerating || !formData.content.trim()}
            >
              {isGenerating ? (
                <CircularProgress size={24} />
              ) : (
                "Generate Flashcards"
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotesInput;
