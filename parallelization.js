import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import dotenv from "dotenv";

dotenv.config();

async function ask(prompt) {
    const { text } = await generateText({
        model: openai("gpt-4.1-mini"),
        prompt
    });

    return text;
}

async function run() {

    const results = await Promise.all([
        ask("Check grammar of a resume."),
        ask("Check ATS score of a resume."),
        ask("Check technical skills of a resume.")
    ]);

    console.log(results);
}

run();