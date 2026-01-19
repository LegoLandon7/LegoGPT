// Imports
require("dotenv").config();
const OpenAI = require('openai');

// OpenAI client
const client = new OpenAI({
    apiKey: process.env.API_KEY
});

// AI contexts
const CONTEXTS = {
    BASE_CONTEXT: "Context:\n" +
        "- You are a friendly Discord (markdown, user ids valid) chatbot who likes Lego, but it’s not your whole personality.\n" +
        "- Respond short, casual, and chatty. Avoid NSFW or harmful content.\n" +
        "- Reflect the user's tone slightly; never say you are a bot.\n" +
        "- Mention Lego only naturally. Use emojis sparingly.\n" +
        "- Focus on the last message. Use history only if needed. (chat has many users, pay attention to the users)\n" +
        "- Do not assume what users said; do not mix messages between users.\n" +
        "- Lines starting with 'Summary:' are background context.\n" +
        "- If unclear or not directed at you, respond vaguely or briefly, no response should EVER be more than 3 sentences.\n" +
        "- Just chat; replies can be playful but fit the conversation.\n" +
        "- You are only a language model, no images or files.\n",

    SUMMARIZE_CONTEXT: "Context:\n" +
        "- You are a simple Discord chatbot that keeps a short, incremental memory of the channel.\n" +
        "- Input will contain an old summary and new messages. The format will be:\n" +
        "  1. Update the old summary using only the new messages.\n" +
        "  2. Keep the summary very short (1-3 sentences).\n" +
        "  3. Include only information explicitly present in the new messages or old summary.\n" +
        "  4. Preserve ongoing context from the old summary.\n" +
        "  5. Do not restate each message or invent new facts.\n" +
        "  6. Output only the updated summary. Do not include any headers or extra text.\n",
}

// Get AI reponse
async function getResponse(textInput, context, modelName) {
    // input string
    const aiInput = `${context}\n\n${textInput}`;

    // ai model
    const response = await client.responses.create({
        model: modelName,
        input: aiInput,
    });

    // output text
    const text = response.output_text || response.output?.[0]?.content?.[0]?.text || "⚠️ No AI response.";

    console.log("❌ Input length: ", aiInput.length);
    console.log("✅ Output length: ", text.length);
    
    let price;
    if (modelName === 'gpt-5-nano') price = ((aiInput.length / 4) * (0.05 / 1000000)) + ((text.length / 4) * (0.4 / 1000000));
    if (modelName === 'gpt-5-mini') price = ((aiInput.length / 4) * (0.25 / 1000000)) + ((text.length / 4) * (2.0 / 1000000));

    console.log("➡️ Cost: ~$", price);

    return text;
}

module.exports = { CONTEXTS, getResponse}