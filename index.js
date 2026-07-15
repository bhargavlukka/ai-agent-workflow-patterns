import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import dotenv from "dotenv";

dotenv.config();

async function run() {
    const { text } = await generateText({
        model: openai("gpt-4.1-mini"),
        prompt: "Say hello to Bhargava"
    });

    console.log(text);
}

run();