const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    console.log("Testing OpenAI API key...");
    console.log(
      "API Key (first 10 chars):",
      process.env.OPENAI_API_KEY?.substring(0, 10) + "..."
    );

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates flashcards.",
        },
        {
          role: "user",
          content: "Generate 2 flashcards about JavaScript.",
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    console.log("✅ OpenAI API is working!");
    console.log("Response:", response.choices[0].message.content);
  } catch (error) {
    console.error("❌ OpenAI API Error:");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
    console.error("Type:", error.type);
    console.error("Code:", error.code);
  }
}

testOpenAI();
