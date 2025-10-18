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

    // Try smart batching for bulk push
    try {
      const notes = flashcards.map((flashcard) => ({
        deckName: deckName,
        modelName: "Basic",
        fields: {
          Front: flashcard.question,
          Back: flashcard.answer,
        },
        tags: ["anki-flashcard-generator"],
      }));

      // For more than 5 cards, use smaller batches
      if (flashcards.length > 5) {
        console.log(
          `Using batch processing for ${flashcards.length} flashcards`
        );
        const batchSize = 3; // Smaller batches for better reliability
        const results = [];
        let totalSuccess = 0;
        let totalFailed = 0;

        for (let i = 0; i < notes.length; i += batchSize) {
          const batch = notes.slice(i, i + batchSize);
          try {
            console.log(
              `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
                notes.length / batchSize
              )} (${batch.length} cards)`
            );
            const batchResult = await makeAnkiRequest("addNotes", {
              notes: batch,
            });
            const successful = batchResult.filter(
              (noteId, index) => noteId !== null
            );
            const failed = batchResult.filter(
              (noteId, index) => noteId === null
            );

            results.push(...successful);
            totalSuccess += successful.length;
            totalFailed += failed.length;

            if (failed.length > 0) {
              console.warn(
                `Batch ${Math.floor(i / batchSize) + 1}: ${
                  failed.length
                } cards failed`
              );
            } else {
              console.log(
                `✅ Batch ${Math.floor(i / batchSize) + 1}: All ${
                  batch.length
                } cards added successfully`
              );
            }

            // Small delay between batches
            if (i + batchSize < notes.length) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          } catch (batchError) {
            console.error(
              `Batch ${Math.floor(i / batchSize) + 1} failed:`,
              batchError.message
            );
            totalFailed += batch.length;
          }
        }

        return {
          added: totalSuccess,
          failed: totalFailed,
          deckName: deckName,
          noteIds: results,
        };
      } else {
        // For 5 or fewer cards, try single bulk push
        console.log(
          `Using single bulk push for ${flashcards.length} flashcards`
        );
        const result = await makeAnkiRequest("addNotes", { notes });
        const successfulNotes = result.filter(
          (noteId, index) => noteId !== null
        );
        const failedNotes = result.filter((noteId, index) => noteId === null);

        if (failedNotes.length > 0) {
          console.warn(`${failedNotes.length} flashcards failed in bulk push`);
        }

        return {
          added: successfulNotes.length,
          failed: failedNotes.length,
          deckName: deckName,
          noteIds: successfulNotes,
        };
      }
    } catch (bulkError) {
      console.log("Bulk push failed, trying individual pushes...");

      // Fallback: push one at a time
      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < flashcards.length; i++) {
        try {
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

          const result = await makeAnkiRequest("addNote", { note });
          if (result) {
            results.push(result);
            successCount++;
            console.log(
              `✅ Flashcard ${i + 1}/${flashcards.length} added successfully`
            );
          } else {
            failCount++;
            console.log(`❌ Flashcard ${i + 1}/${flashcards.length} failed`);
          }
        } catch (cardError) {
          failCount++;
          console.error(
            `❌ Flashcard ${i + 1}/${flashcards.length} failed:`,
            cardError.message
          );
        }

        // Small delay between individual pushes
        if (i < flashcards.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      return {
        added: successCount,
        failed: failCount,
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
