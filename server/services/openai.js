const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateFlashcards = async (content, topic = null) => {
  try {
    const systemPrompt = `You are an expert at creating educational flashcards for Anki spaced repetition software. Generate 5-8 high-quality flashcards from the provided text content. Each flashcard should have a clear, concise question and a comprehensive answer.

Guidelines:
- Questions should test understanding, not just memorization
- Answers should be informative and educational
- Use different question types: factual, conceptual, analytical
- Make questions specific and focused
- Ensure answers are accurate and complete
- Keep questions and answers concise but comprehensive
- Format as a clean JSON array with "question" and "answer" fields
- Do NOT wrap the response in markdown code blocks
- Return only the JSON array, no additional text
- Each flashcard should be suitable for Anki's spaced repetition algorithm

${topic ? `Focus on the topic: ${topic}` : ""}`;

    const userPrompt = `Please create flashcards from this content:

${content}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;

    // Try to parse the JSON response
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      const flashcards = JSON.parse(cleanResponse);

      // Validate the response format
      if (!Array.isArray(flashcards)) {
        throw new Error("Response is not an array");
      }

      // Validate each flashcard has required fields
      const validFlashcards = flashcards.filter(
        (card) =>
          card.question &&
          card.answer &&
          typeof card.question === "string" &&
          typeof card.answer === "string"
      );

      if (validFlashcards.length === 0) {
        throw new Error("No valid flashcards found in response");
      }

      return validFlashcards;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.error("Raw response:", response);

      // Fallback: try to extract flashcards from text format
      return extractFlashcardsFromText(response);
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(
      "Failed to generate flashcards. Please check your OpenAI API key and try again."
    );
  }
};

const extractFlashcardsFromText = (text) => {
  // Try to extract flashcards from various text formats
  const flashcards = [];

  // First, try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*(\[.*?\])\s*```/s);
  if (jsonMatch) {
    try {
      const jsonData = JSON.parse(jsonMatch[1]);
      if (Array.isArray(jsonData)) {
        return jsonData.filter((card) => card.question && card.answer);
      }
    } catch (e) {
      // Continue with other extraction methods
    }
  }

  // Look for Q: and A: patterns
  const qaPattern = /Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gs;
  let match;

  while ((match = qaPattern.exec(text)) !== null) {
    flashcards.push({
      question: match[1].trim(),
      answer: match[2].trim(),
    });
  }

  // If no Q: A: pattern found, try other patterns
  if (flashcards.length === 0) {
    const lines = text.split("\n").filter((line) => line.trim());
    let currentQuestion = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (
        line.toLowerCase().startsWith("question") ||
        line.toLowerCase().startsWith("q:")
      ) {
        currentQuestion = line.replace(/^(question|q:)\s*/i, "").trim();
      } else if (
        currentQuestion &&
        (line.toLowerCase().startsWith("answer") ||
          line.toLowerCase().startsWith("a:"))
      ) {
        const answer = line.replace(/^(answer|a:)\s*/i, "").trim();
        flashcards.push({
          question: currentQuestion,
          answer: answer,
        });
        currentQuestion = null; // Reset for next pair
      }
    }
  }

  return flashcards;
};

module.exports = { generateFlashcards };
