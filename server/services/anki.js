const axios = require("axios");

const ANKI_CONNECT_URL = "http://localhost:8765";

const makeAnkiRequest = async (action, params = {}) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `AnkiConnect attempt ${attempt}/${maxRetries} for action: ${action}`
      );

      const response = await axios.post(
        ANKI_CONNECT_URL,
        {
          action,
          version: 6,
          params,
        },
        {
          timeout: 15000, // Reduced timeout
          headers: {
            "Content-Type": "application/json",
            Connection: "close", // Force new connection each time
          },
          // Simplified connection handling
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 300,
          // Disable keep-alive to prevent connection issues
          httpAgent: new (require("http").Agent)({ keepAlive: false }),
        }
      );

      if (response.data.error) {
        throw new Error(`AnkiConnect error: ${response.data.error}`);
      }

      console.log(`✅ AnkiConnect success on attempt ${attempt}`);
      return response.data.result;
    } catch (error) {
      lastError = error;
      console.error(`❌ AnkiConnect attempt ${attempt} failed:`, error.message);

      // Don't retry for certain errors
      if (
        error.response?.data?.error &&
        !error.response.data.error.includes("deck")
      ) {
        throw new Error(`AnkiConnect error: ${error.response.data.error}`);
      }

      // Wait before retry (except on last attempt)
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting 2 seconds before retry...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  // All retries failed
  console.error("All AnkiConnect attempts failed:", lastError.message);

  if (
    lastError.code === "ECONNREFUSED" ||
    lastError.code === "ECONNRESET" ||
    lastError.code === "ECONNABORTED"
  ) {
    throw new Error(
      "Anki is not running or AnkiConnect is not installed. Please make sure Anki is open and AnkiConnect add-on is enabled."
    );
  }
  if (lastError.code === "ETIMEDOUT") {
    throw new Error("AnkiConnect request timed out. Please try again.");
  }
  if (lastError.message.includes("socket hang up")) {
    throw new Error(
      "Connection to Anki was lost. Please make sure Anki is running and try again."
    );
  }
  throw new Error(
    `Failed to connect to Anki after ${maxRetries} attempts: ${lastError.message}`
  );
};

const checkAnkiConnection = async () => {
  try {
    await makeAnkiRequest("version");
    return true;
  } catch (error) {
    console.error("Anki connection check failed:", error.message);
    return false;
  }
};

const getAnkiDecks = async () => {
  try {
    const deckNames = await makeAnkiRequest("deckNames");
    return deckNames;
  } catch (error) {
    console.error("Error fetching Anki decks:", error);
    throw new Error("Failed to fetch Anki decks");
  }
};

const pushToAnki = async (flashcards, deckName = "Default") => {
  try {
    if (!flashcards || flashcards.length === 0) {
      throw new Error("No flashcards provided");
    }

    console.log(
      `Pushing ${flashcards.length} flashcards to Anki deck: ${deckName}`
    );

    // First, check if the deck exists, if not create it
    try {
      const existingDecks = await getAnkiDecks();
      if (!existingDecks.includes(deckName)) {
        await makeAnkiRequest("createDeck", { deck: deckName });
        console.log(`Created new deck: ${deckName}`);
      }
    } catch (deckError) {
      console.warn("Could not check/create deck:", deckError.message);
    }

    // Process flashcards individually for better reliability
    const notes = flashcards.map((flashcard) => ({
      deckName: deckName,
      modelName: "Basic",
      fields: {
        Front: flashcard.question,
        Back: flashcard.answer,
      },
      tags: ["anki-flashcard-generator"],
    }));

    // For more than 3 cards, use individual processing with batching for efficiency
    if (flashcards.length > 3) {
      console.log(
        `Using individual processing for ${flashcards.length} flashcards`
      );
      const results = [];
      let totalSuccess = 0;
      let totalFailed = 0;

      // Process cards individually but with small delays for efficiency
      for (let i = 0; i < flashcards.length; i++) {
        const flashcard = flashcards[i];
        const note = {
          deckName: deckName,
          modelName: "Basic",
          fields: {
            Front: flashcard.question,
            Back: flashcard.answer,
          },
          tags: ["anki-flashcard-generator"],
        };

        try {
          const result = await makeAnkiRequest("addNote", { note });
          if (result) {
            results.push(result);
            totalSuccess++;
            console.log(
              `✅ Flashcard ${i + 1}/${flashcards.length} added successfully`
            );
          } else {
            totalFailed++;
            console.log(`❌ Flashcard ${i + 1}/${flashcards.length} failed`);
          }
        } catch (cardError) {
          // Check if it's a duplicate error - this is actually a success case
          if (cardError.message.includes("duplicate")) {
            totalSuccess++;
            console.log(
              `✅ Flashcard ${i + 1}/${
                flashcards.length
              } already exists in Anki (duplicate)`
            );
          } else {
            totalFailed++;
            console.error(
              `❌ Flashcard ${i + 1}/${flashcards.length} failed:`,
              cardError.message
            );
          }
        }

        // Small delay between cards to avoid overwhelming Anki
        if (i < flashcards.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      return {
        added: totalSuccess,
        failed: totalFailed,
        deckName: deckName,
        noteIds: results,
      };
    } else {
      // For 3 or fewer cards, use individual processing as well for consistency
      console.log(
        `Using individual processing for ${flashcards.length} flashcards`
      );
      const results = [];
      let totalSuccess = 0;
      let totalFailed = 0;

      for (let i = 0; i < flashcards.length; i++) {
        const flashcard = flashcards[i];
        const note = {
          deckName: deckName,
          modelName: "Basic",
          fields: {
            Front: flashcard.question,
            Back: flashcard.answer,
          },
          tags: ["anki-flashcard-generator"],
        };

        try {
          const result = await makeAnkiRequest("addNote", { note });
          if (result) {
            results.push(result);
            totalSuccess++;
            console.log(
              `✅ Flashcard ${i + 1}/${flashcards.length} added successfully`
            );
          } else {
            totalFailed++;
            console.log(`❌ Flashcard ${i + 1}/${flashcards.length} failed`);
          }
        } catch (cardError) {
          // Check if it's a duplicate error - this is actually a success case
          if (cardError.message.includes("duplicate")) {
            totalSuccess++;
            console.log(
              `✅ Flashcard ${i + 1}/${
                flashcards.length
              } already exists in Anki (duplicate)`
            );
          } else {
            totalFailed++;
            console.error(
              `❌ Flashcard ${i + 1}/${flashcards.length} failed:`,
              cardError.message
            );
          }
        }

        // Small delay between cards
        if (i < flashcards.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      return {
        added: totalSuccess,
        failed: totalFailed,
        deckName: deckName,
        noteIds: results,
      };
    }
  } catch (error) {
    console.error("Error pushing to Anki:", error);
    throw new Error(`Failed to push flashcards to Anki: ${error.message}`);
  }
};

const getAnkiModels = async () => {
  try {
    const modelNames = await makeAnkiRequest("modelNames");
    return modelNames;
  } catch (error) {
    console.error("Error fetching Anki models:", error);
    throw new Error("Failed to fetch Anki models");
  }
};

const getAnkiModelFieldNames = async (modelName) => {
  try {
    const fieldNames = await makeAnkiRequest("modelFieldNames", { modelName });
    return fieldNames;
  } catch (error) {
    console.error("Error fetching Anki model field names:", error);
    throw new Error("Failed to fetch Anki model field names");
  }
};

module.exports = {
  makeAnkiRequest,
  checkAnkiConnection,
  getAnkiDecks,
  pushToAnki,
  getAnkiModels,
  getAnkiModelFieldNames,
};
