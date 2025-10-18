import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import { School, NoteAdd, AutoAwesome, TrendingUp } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFlashcards, Note } from "../contexts/FlashcardContext";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notes, flashcards, fetchNotes, fetchFlashcards, loading, error } =
    useFlashcards();
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalFlashcards: 0,
    generatedFlashcards: 0,
    manualFlashcards: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchNotes(), fetchFlashcards()]);
    };
    loadData();
  }, [fetchNotes, fetchFlashcards]);

  useEffect(() => {
    const generatedCount = flashcards.filter((f) => f.is_generated).length;
    const manualCount = flashcards.filter((f) => !f.is_generated).length;

    setStats({
      totalNotes: notes.length,
      totalFlashcards: flashcards.length,
      generatedFlashcards: generatedCount,
      manualFlashcards: manualCount,
    });
  }, [notes, flashcards]);

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
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.username}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your notes and flashcards for effective learning.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))"
        gap={3}
        mb={3}
      >
        {/* Stats Cards */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <NoteAdd color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Notes</Typography>
            </Box>
            <Typography variant="h3" color="primary">
              {stats.totalNotes}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total notes created
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <School color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">Flashcards</Typography>
            </Box>
            <Typography variant="h3" color="secondary">
              {stats.totalFlashcards}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total flashcards
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <AutoAwesome color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">AI Generated</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              {stats.generatedFlashcards}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-generated cards
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingUp color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Manual</Typography>
            </Box>
            <Typography variant="h3" color="info.main">
              {stats.manualFlashcards}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manually created
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
            gap={2}
          >
            <Button
              variant="contained"
              fullWidth
              startIcon={<NoteAdd />}
              onClick={() => navigate("/notes")}
              sx={{ height: 56 }}
            >
              Add New Note
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<School />}
              onClick={() => navigate("/flashcards")}
              sx={{ height: 56 }}
            >
              View Flashcards
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AutoAwesome />}
              onClick={() => navigate("/notes")}
              sx={{ height: 56 }}
            >
              Generate Cards
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<School />}
              onClick={() => navigate("/flashcards")}
              sx={{ height: 56 }}
            >
              Push to Anki
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Recent Notes */}
      {notes.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Notes
            </Typography>
            <Box
              display="grid"
              gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
              gap={2}
            >
              {notes.slice(0, 3).map((note: Note) => (
                <Card variant="outlined" key={note.id}>
                  <CardContent>
                    <Typography variant="h6" noWrap>
                      {note.title || "Untitled Note"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {note.content.substring(0, 100)}...
                    </Typography>
                    {note.topic && (
                      <Chip label={note.topic} size="small" sx={{ mt: 1 }} />
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/notes?noteId=${note.id}`)}
                    >
                      View
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Dashboard;
