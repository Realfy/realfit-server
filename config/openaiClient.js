import OpenAI from "openai";
import { OPENAI_API_KEY } from "../envConfig.js";

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

export default openai;