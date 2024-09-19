import openai from "../config/openaiClient.js";


export async function getGptResponse(prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: "system", content: "You are a nutrition assistant."
                },
                {
                    role: "user", content: prompt
                }
            ],
            temperature: 0.8
        });
        return response;
    }
    catch (err) {
        console.log("Caught error in getGptResponse() helper func due to ");
        console.error(err);
        return null;
    }
}


export function getDietPlanSuggestPrompt(userDetails) {
    const prompt = `
  User details: ${JSON.stringify(userDetails)}

  Based on the above user details, suggest a diet plan for breakfast, lunch, snacks, and dinner. 
  Provide each meal as an array of objects containing the following fields:
  - item (name of the food)
  - recipe (required materials and steps to prepare this food item)
  - in_take_standard_quantity (serving size in standard quantity according to item)
  - in_take_quantity_grams (serving size in grams)
  - in_take_calories_gained (total calories per serving)
  - serving_quantity (standard sering quantity in grams)
  - fat (per serving quantity)
  - carbohydrates (per serving quantity)
  - protein (per serving quantity)
  - calories(calories per serving quantity)

  Return ONLY a valid JSON object without any explanations, comments, or extra formatting. Ensure the JSON is valid.
  `;
    
    return prompt;
}
