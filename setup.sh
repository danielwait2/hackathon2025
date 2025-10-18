#!/bin/bash

echo "Setting up Anki Flashcard Generator..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install
cd ..

echo "Setup complete!"
echo "Next steps:"
echo "1. Copy server/env.example to server/.env"
echo "2. Add your OpenAI API key to server/.env"
echo "3. Run 'npm run dev' to start the application"
