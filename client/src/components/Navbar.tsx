import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  Chip,
} from "@mui/material";
import { AccountCircle, School } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFlashcards } from "../contexts/FlashcardContext";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { checkAnkiConnection } = useFlashcards();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [ankiConnected, setAnkiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await checkAnkiConnection();
        setAnkiConnected(connected);
      } catch (error) {
        setAnkiConnected(false);
      }
    };

    if (user) {
      checkConnection();
    }
  }, [user, checkAnkiConnection]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate("/login");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          Anki Flashcard Generator
        </Typography>

        {user && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button color="inherit" onClick={() => navigate("/")}>
              Dashboard
            </Button>
            <Button color="inherit" onClick={() => navigate("/notes")}>
              Add Notes
            </Button>
            <Button color="inherit" onClick={() => navigate("/flashcards")}>
              Flashcards
            </Button>

            {ankiConnected !== null && (
              <Chip
                icon={<School />}
                label={ankiConnected ? "Anki Connected" : "Anki Disconnected"}
                color={ankiConnected ? "success" : "error"}
                size="small"
              />
            )}

            <Button
              color="inherit"
              startIcon={<AccountCircle />}
              onClick={handleMenu}
            >
              {user.username}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
