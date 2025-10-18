# Anki Flashcard Generator

A web application that generates Anki flashcards from your notes using AI. Create, manage, and export flashcards to Anki for spaced repetition learning.

## Features

- **AI-Powered Flashcard Generation**: Uses OpenAI to create high-quality flashcards from your notes
- **Note Management**: Create, edit, and organize your study notes
- **Flashcard Management**: View, edit, and manage generated and manual flashcards
- **Anki Integration**: Push flashcards directly to Anki via AnkiConnect
- **Smart Batching**: Automatically handles large batches of flashcards
- **User Authentication**: Secure user accounts with JWT authentication

## Tech Stack

- **Frontend**: React, TypeScript, Material-UI
- **Backend**: Node.js, Express, SQLite
- **AI**: OpenAI API
- **Anki Integration**: AnkiConnect

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Anki installed on your computer
- AnkiConnect add-on installed in Anki
- OpenAI API key

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd hackathon2025
   ```

2. **Run the setup script**

   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Configure environment variables**

   ```bash
   cp server/env.example server/.env
   # Edit server/.env and add your OpenAI API key
   ```

4. **Install AnkiConnect**
   - Open Anki
   - Go to Tools → Add-ons → Get Add-ons
   - Enter code: `2055492159`
   - Restart Anki

### Running the Application

1. **Start both servers**

   ```bash
   chmod +x start-dev.sh
   ./start-dev.sh
   ```

   Or manually:

   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm start
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001/api

## Usage

1. **Create an account** or login
2. **Add notes** by going to "Add Notes" page
3. **Generate flashcards** using the AI button
4. **Review and edit** flashcards on the Flashcards page
5. **Push to Anki** by selecting flashcards and choosing a deck

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Notes

- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `POST /api/notes/:id/generate-flashcards` - Generate flashcards from note

### Flashcards

- `GET /api/flashcards` - Get all flashcards
- `POST /api/flashcards` - Create flashcard
- `PUT /api/flashcards/:id` - Update flashcard
- `DELETE /api/flashcards/:id` - Delete flashcard
- `DELETE /api/flashcards/bulk` - Bulk delete flashcards

### Anki Integration

- `GET /api/anki/connection` - Check Anki connection
- `GET /api/anki/decks` - Get Anki decks
- `POST /api/anki/push` - Push flashcards to Anki
- `POST /api/anki/push-note/:id` - Push all flashcards from a note

## Troubleshooting

### AnkiConnect Issues

- Make sure Anki is running
- Verify AnkiConnect add-on is installed and enabled
- Check that AnkiConnect is running on port 8765
- Try restarting Anki if connection fails

### OpenAI API Issues

- Verify your API key is correct in `server/.env`
- Check that you have sufficient API credits
- Ensure the API key has access to the GPT-3.5-turbo model

### Development Issues

- Make sure both servers are running
- Check that ports 3000 and 5001 are available
- Verify all dependencies are installed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
