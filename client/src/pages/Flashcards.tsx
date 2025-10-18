import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Menu,
} from "@mui/material";
import {
  Edit,
  Delete,
  Add,
  School,
  AutoAwesome,
  FilterList,
  SelectAll,
  Clear,
} from "@mui/icons-material";
import { useFlashcards, Flashcard } from "../contexts/FlashcardContext";

const Flashcards: React.FC = () => {
  const {
    flashcards,
    loading,
    error,
    fetchFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    bulkDeleteFlashcards,
    pushToAnki,
    getAnkiDecks,
    checkAnkiConnection,
  } = useFlashcards();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(
    null
  );
  const [editForm, setEditForm] = useState({ question: "", answer: "" });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAnkiDialogOpen, setIsAnkiDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ question: "", answer: "" });
  const [selectedFlashcards, setSelectedFlashcards] = useState<number[]>([]);
  const [ankiDecks, setAnkiDecks] = useState<string[]>([]);
  const [selectedDeck, setSelectedDeck] = useState("");
  const [ankiConnected, setAnkiConnected] = useState<boolean | null>(null);
  const [filterType, setFilterType] = useState<"all" | "generated" | "manual">(
    "all"
  );
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  );

  const checkAnkiStatus = useCallback(async () => {
    const connected = await checkAnkiConnection();
    setAnkiConnected(connected);
  }, [checkAnkiConnection]);

  useEffect(() => {
    fetchFlashcards();
    checkAnkiStatus();
  }, [fetchFlashcards, checkAnkiStatus]);

  const handleEdit = (flashcard: Flashcard) => {
    setEditingFlashcard(flashcard);
    setEditForm({ question: flashcard.question, answer: flashcard.answer });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingFlashcard) {
      await updateFlashcard(
        editingFlashcard.id,
        editForm.question,
        editForm.answer
      );
      setIsEditDialogOpen(false);
      setEditingFlashcard(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this flashcard?")) {
      await deleteFlashcard(id);
    }
  };

  const handleCreate = async () => {
    if (!createForm.question.trim() || !createForm.answer.trim()) return;

    try {
      await createFlashcard(createForm.question, createForm.answer);
      setCreateForm({ question: "", answer: "" });
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error("Error creating flashcard:", err);
    }
  };

  const handleAnkiPush = async () => {
    if (!selectedDeck || selectedFlashcards.length === 0) return;

    try {
      await pushToAnki(selectedFlashcards, selectedDeck);
      setSelectedFlashcards([]);
      setIsAnkiDialogOpen(false);
      alert(
        `Successfully pushed ${selectedFlashcards.length} flashcards to Anki!`
      );
    } catch (err) {
      console.error("Error pushing to Anki:", err);
      alert(
        "Failed to push flashcards to Anki. Make sure Anki is running and AnkiConnect is installed."
      );
    }
  };

  const loadAnkiDecks = async () => {
    try {
      const decks = await getAnkiDecks();
      setAnkiDecks(decks);
      if (decks.length > 0 && !selectedDeck) {
        setSelectedDeck(decks[0]);
      }
    } catch (err) {
      console.error("Error loading Anki decks:", err);
    }
  };

  const handleSelectAll = () => {
    if (selectedFlashcards.length === filteredFlashcards.length) {
      setSelectedFlashcards([]);
    } else {
      setSelectedFlashcards(filteredFlashcards.map((card) => card.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedFlashcards((prev) =>
      prev.includes(id) ? prev.filter((_id) => _id !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedFlashcards.length === 0) {
      alert("Please select flashcards to delete.");
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedFlashcards.length} selected flashcards?`
      )
    ) {
      try {
        await bulkDeleteFlashcards(selectedFlashcards);
        setSelectedFlashcards([]);
        alert("Selected flashcards deleted successfully!");
      } catch (err: any) {
        alert(`Failed to delete selected flashcards: ${err.message}`);
      }
    }
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterChange = (type: "all" | "generated" | "manual") => {
    setFilterType(type);
    handleFilterClose();
  };

  const filteredFlashcards = flashcards.filter((flashcard) => {
    if (filterType === "generated") {
      return flashcard.is_generated;
    }
    if (filterType === "manual") {
      return !flashcard.is_generated;
    }
    return true;
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" component="h1">
          Your Flashcards
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={handleFilterClick}
            sx={{ mr: 1 }}
          >
            Filter ({filterType})
          </Button>
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
          >
            <MenuItem onClick={() => handleFilterChange("all")}>All</MenuItem>
            <MenuItem onClick={() => handleFilterChange("generated")}>
              AI Generated
            </MenuItem>
            <MenuItem onClick={() => handleFilterChange("manual")}>
              Manual
            </MenuItem>
          </Menu>

          <Button
            variant="outlined"
            startIcon={<SelectAll />}
            onClick={handleSelectAll}
            sx={{ mr: 1 }}
          >
            {selectedFlashcards.length === filteredFlashcards.length
              ? "Deselect All"
              : "Select All"}
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Delete />}
            onClick={handleBulkDelete}
            disabled={selectedFlashcards.length === 0}
          >
            Delete Selected ({selectedFlashcards.length})
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <Box display="flex" gap={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Add Flashcard
          </Button>

          <Button
            variant="outlined"
            startIcon={<School />}
            onClick={() => setIsAnkiDialogOpen(true)}
            disabled={selectedFlashcards.length === 0}
          >
            Push to Anki ({selectedFlashcards.length})
          </Button>
        </Box>

        <Box display="flex" gap={2} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={handleFilterClick}
          >
            Filter:{" "}
            {filterType === "all"
              ? "All"
              : filterType === "generated"
              ? "AI Generated"
              : "Manual"}
          </Button>
        </Box>
      </Box>

      {/* Anki Push Dialog */}
      <Dialog
        open={isAnkiDialogOpen}
        onClose={() => setIsAnkiDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Push to Anki
          {ankiConnected === false && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Anki is not connected. Make sure Anki is running and AnkiConnect
              is installed.
            </Alert>
          )}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Selected flashcards: {selectedFlashcards.length}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Select Deck</InputLabel>
            <Select
              value={selectedDeck}
              label="Select Deck"
              onChange={(e) => setSelectedDeck(e.target.value)}
              onOpen={loadAnkiDecks}
            >
              {ankiDecks.map((deck) => (
                <MenuItem key={deck} value={deck}>
                  {deck}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAnkiDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAnkiPush}
            variant="contained"
            disabled={!selectedDeck || selectedFlashcards.length === 0}
          >
            Push to Anki
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Flashcard Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Flashcard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Question"
            type="text"
            fullWidth
            variant="outlined"
            value={createForm.question}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, question: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Answer"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={createForm.answer}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, answer: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Flashcard Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Flashcard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Question"
            type="text"
            fullWidth
            variant="outlined"
            value={editForm.question}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, question: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Answer"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={editForm.answer}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, answer: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Flashcards Grid */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(350px, 1fr))"
        gap={3}
      >
        {filteredFlashcards.map((flashcard) => (
          <Box key={flashcard.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    {flashcard.is_generated ? "AI Generated" : "Manual"}
                  </Typography>
                  <Checkbox
                    checked={selectedFlashcards.includes(flashcard.id)}
                    onChange={() => handleToggleSelect(flashcard.id)}
                    size="small"
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Q: {flashcard.question}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  A: {flashcard.answer}
                </Typography>
                {flashcard.note_title && (
                  <Chip
                    label={`From: ${flashcard.note_title}`}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => handleEdit(flashcard)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => handleDelete(flashcard.id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      {filteredFlashcards.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No flashcards found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start by adding notes and generating flashcards!
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => alert("Navigate to Add Notes page")}
          >
            Add Notes
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Flashcards;
