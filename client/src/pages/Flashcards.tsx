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
    fetchFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    pushToAnki,
    getAnkiDecks,
    checkAnkiConnection,
    loading,
    error,
  } = useFlashcards();

  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAnkiDialogOpen, setIsAnkiDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ question: "", answer: "" });
  const [createForm, setCreateForm] = useState({ question: "", answer: "" });
  const [selectedFlashcards, setSelectedFlashcards] = useState<number[]>([]);
  const [ankiDecks, setAnkiDecks] = useState<string[]>([]);
  const [selectedDeck, setSelectedDeck] = useState("");
  const [newDeckName, setNewDeckName] = useState("");
  const [showNewDeckInput, setShowNewDeckInput] = useState(false);
  const [isPushingToAnki, setIsPushingToAnki] = useState(false);
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

  const handleEditSubmit = async () => {
    if (!editingFlashcard) return;

    try {
      await updateFlashcard(
        editingFlashcard.id,
        editForm.question,
        editForm.answer
      );
      setIsEditDialogOpen(false);
      setEditingFlashcard(null);
    } catch (err) {
      console.error("Error updating flashcard:", err);
    }
  };

  const handleCreate = async () => {
    try {
      await createFlashcard(createForm.question, createForm.answer);
      setCreateForm({ question: "", answer: "" });
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error("Error creating flashcard:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this flashcard?")) {
      try {
        await deleteFlashcard(id);
      } catch (err) {
        console.error("Error deleting flashcard:", err);
      }
    }
  };

  const handleSelectFlashcard = (id: number) => {
    setSelectedFlashcards((prev) =>
      prev.includes(id)
        ? prev.filter((flashcardId) => flashcardId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const filteredFlashcards = getFilteredFlashcards();
    setSelectedFlashcards(
      selectedFlashcards.length === filteredFlashcards.length
        ? []
        : filteredFlashcards.map((f) => f.id)
    );
  };

  const handleAnkiPush = async () => {
    if (selectedFlashcards.length === 0) return;

    // Determine which deck to use
    const deckToUse = showNewDeckInput ? newDeckName.trim() : selectedDeck;

    if (!deckToUse) {
      alert("Please select a deck or enter a new deck name");
      return;
    }

    setIsPushingToAnki(true);

    try {
      await pushToAnki(selectedFlashcards, deckToUse);
      setSelectedFlashcards([]);
      setIsAnkiDialogOpen(false);
      setShowNewDeckInput(false);
      setNewDeckName("");
      setSelectedDeck("");

      // Refresh the deck list to include the new deck
      await loadAnkiDecks();

      alert(
        `Successfully pushed ${selectedFlashcards.length} flashcards to Anki deck "${deckToUse}"!`
      );
    } catch (err) {
      console.error("Error pushing to Anki:", err);
      alert(
        "Failed to push flashcards to Anki. Make sure Anki is running and AnkiConnect is installed."
      );
    } finally {
      setIsPushingToAnki(false);
    }
  };

  const loadAnkiDecks = async () => {
    try {
      const decks = await getAnkiDecks();
      setAnkiDecks(decks);
    } catch (err) {
      console.error("Error loading Anki decks:", err);
    }
  };

  const getFilteredFlashcards = () => {
    return flashcards.filter((flashcard) => {
      if (filterType === "generated") return flashcard.is_generated;
      if (filterType === "manual") return !flashcard.is_generated;
      return true;
    });
  };

  const filteredFlashcards = getFilteredFlashcards();

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
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Flashcards
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and review your flashcards. Edit, delete, or push to Anki.
        </Typography>
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
            startIcon={
              isPushingToAnki ? <CircularProgress size={20} /> : <School />
            }
            onClick={() => setIsAnkiDialogOpen(true)}
            disabled={selectedFlashcards.length === 0 || isPushingToAnki}
          >
            {isPushingToAnki
              ? "Pushing..."
              : `Push to Anki (${selectedFlashcards.length})`}
          </Button>
        </Box>

        <Box display="flex" gap={2} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
          >
            Filter:{" "}
            {filterType === "all"
              ? "All"
              : filterType === "generated"
              ? "AI Generated"
              : "Manual"}
          </Button>

          <Button
            variant="outlined"
            startIcon={
              selectedFlashcards.length === filteredFlashcards.length ? (
                <Clear />
              ) : (
                <SelectAll />
              )
            }
            onClick={handleSelectAll}
            disabled={filteredFlashcards.length === 0}
          >
            {selectedFlashcards.length === filteredFlashcards.length
              ? "Deselect All"
              : "Select All"}
          </Button>
        </Box>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setFilterType("all");
            setFilterAnchorEl(null);
          }}
        >
          All Flashcards
        </MenuItem>
        <MenuItem
          onClick={() => {
            setFilterType("generated");
            setFilterAnchorEl(null);
          }}
        >
          AI Generated
        </MenuItem>
        <MenuItem
          onClick={() => {
            setFilterType("manual");
            setFilterAnchorEl(null);
          }}
        >
          Manual
        </MenuItem>
      </Menu>

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
                border: selectedFlashcards.includes(flashcard.id)
                  ? "2px solid"
                  : "1px solid",
                borderColor: selectedFlashcards.includes(flashcard.id)
                  ? "primary.main"
                  : "divider",
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={2}
                >
                  <Chip
                    icon={flashcard.is_generated ? <AutoAwesome /> : <Add />}
                    label={flashcard.is_generated ? "AI Generated" : "Manual"}
                    color={flashcard.is_generated ? "primary" : "secondary"}
                    size="small"
                  />
                  <Checkbox
                    checked={selectedFlashcards.includes(flashcard.id)}
                    onChange={() => handleSelectFlashcard(flashcard.id)}
                    size="small"
                  />
                </Box>

                <Typography variant="h6" gutterBottom>
                  Question:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, minHeight: 40 }}>
                  {flashcard.question}
                </Typography>

                <Typography variant="h6" gutterBottom>
                  Answer:
                </Typography>
                <Typography variant="body2" sx={{ minHeight: 40 }}>
                  {flashcard.answer}
                </Typography>
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
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {filterType === "all"
              ? "Create your first flashcard or add notes to generate them with AI."
              : `No ${filterType} flashcards found. Try changing the filter.`}
          </Typography>
        </Box>
      )}

      {/* Create Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Flashcard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Question"
            fullWidth
            multiline
            rows={3}
            value={createForm.question}
            onChange={(e) =>
              setCreateForm({ ...createForm, question: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Answer"
            fullWidth
            multiline
            rows={4}
            value={createForm.answer}
            onChange={(e) =>
              setCreateForm({ ...createForm, answer: e.target.value })
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

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Flashcard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Question"
            fullWidth
            multiline
            rows={3}
            value={editForm.question}
            onChange={(e) =>
              setEditForm({ ...editForm, question: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Answer"
            fullWidth
            multiline
            rows={4}
            value={editForm.answer}
            onChange={(e) =>
              setEditForm({ ...editForm, answer: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Anki Push Dialog */}
      <Dialog
        open={isAnkiDialogOpen}
        onClose={() => {
          setIsAnkiDialogOpen(false);
          setShowNewDeckInput(false);
          setNewDeckName("");
          setIsPushingToAnki(false);
        }}
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
              onChange={(e) => {
                const value = e.target.value;
                if (value === "__CREATE_NEW__") {
                  setShowNewDeckInput(true);
                  setSelectedDeck("");
                } else {
                  setShowNewDeckInput(false);
                  setSelectedDeck(value);
                }
              }}
              onOpen={loadAnkiDecks}
            >
              {ankiDecks.map((deck) => (
                <MenuItem key={deck} value={deck}>
                  {deck}
                </MenuItem>
              ))}
              <MenuItem
                value="__CREATE_NEW__"
                sx={{
                  borderTop: "1px solid #e0e0e0",
                  mt: 1,
                  pt: 1,
                  color: "primary.main",
                  fontWeight: "bold",
                }}
              >
                + Create New Deck
              </MenuItem>
            </Select>
          </FormControl>

          {showNewDeckInput && (
            <TextField
              fullWidth
              label="New Deck Name"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="Enter deck name..."
              sx={{ mt: 2 }}
              autoFocus
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsAnkiDialogOpen(false);
              setShowNewDeckInput(false);
              setNewDeckName("");
              setIsPushingToAnki(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAnkiPush}
            variant="contained"
            disabled={
              (!selectedDeck && !showNewDeckInput) ||
              selectedFlashcards.length === 0 ||
              isPushingToAnki
            }
            startIcon={
              isPushingToAnki ? <CircularProgress size={20} /> : undefined
            }
          >
            {isPushingToAnki
              ? "Pushing to Anki..."
              : showNewDeckInput
              ? "Create Deck & Push"
              : "Push to Anki"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Flashcards;
