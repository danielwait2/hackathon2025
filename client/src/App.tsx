import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { AuthProvider } from "./contexts/AuthContext";
import { FlashcardProvider } from "./contexts/FlashcardContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotesInput from "./pages/NotesInput";
import Flashcards from "./pages/Flashcards";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <FlashcardProvider>
          <Router>
            <div className="App">
              <Navbar />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notes"
                  element={
                    <ProtectedRoute>
                      <NotesInput />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/flashcards"
                  element={
                    <ProtectedRoute>
                      <Flashcards />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </Router>
        </FlashcardProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
