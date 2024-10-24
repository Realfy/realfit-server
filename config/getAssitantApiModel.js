import openai from "./openaiClient.js";
import { OPENAI_API_KEY } from "../envConfig.js";

const myAssistant = await openai.beta.assistants.create({
    instructions:
        "You are a fitness instructor, helps user to make their diet and workout plan.",
    name: "Realfy Assistant",
    // tools: [
    //     {
    //         type: "function",
    //         function: {
    //             name: "",
    //             description: "",
    //             parameters: {

    //             }
    //         }
    //     }
    // ],
    model: "gpt-4o",
    temperature: 1.8
});

export default myAssistant;