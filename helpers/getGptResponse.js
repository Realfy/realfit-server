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

Based on the above user details, suggest a diet plan for breakfast, lunch, snacks, and dinner for each of the below conditions:
1. A list of all possible food items for each meal (breakfast, lunch, snacks, and dinner) that align with the user's dietary preferences, allergies, calories goal, and activity level from their current diet plan. Adjust the quantities of food items where necessary to ensure they are within healthy, recommended limits.
2. A list of new food items that the user should consider adding to their diet for more variety or improved nutritional balance.
3. A list of food items to remove from the user's current diet plan based on their dietary restrictions or health goals along with the reason.

In case any of the lists is empty, return an empty array.

Provide each meal as an array of objects containing the following fields:
- item (name of the food)
- recipe (required materials and steps to prepare this food item)
- in_take_standard_quantity (serving size in standard quantity according to the item)
- in_take_quantity_grams (serving size in grams)
- in_take_calories_gained (total calories per serving)
- serving_quantity (standard serving quantity or general serving quantity in grams)
- fat (per serving quantity)
- carbohydrates (per serving quantity)
- protein (per serving quantity)
- calories (calories per serving quantity, not per intake quantity)

In the list of recommended food items, mention the items based on different sections like breakfast, lunch, snacks, and dinner:
- recommended (list of objects)
  - breakfast (list of objects)
      - Item 1
      - Item 2
  - Similarly for lunch, snacks, and dinner.

Response structure:
- "caloriesToTake": {
    "breakfast": number,
    "lunch": number,
    "snacks": number,
    "dinner": number
  }
- "currentDiet": [list of possible food items for breakfast, lunch, snacks, and dinner], with adjusted quantities and item details. Decrease or increase quantities if needed, and adjust calories and other information accordingly.
- "recommended": [list of possible food items for breakfast, lunch, snacks, and dinner]. Return an empty array if there are no items to recommend. Recommend food items that are similar to current diet food items as they should be available to user.
- "substitute": [list of food items that can be substituted for which item from the current diet]. Return an empty array if there are no items to substitute.

The substitute array should have the following structure:
- "substitute": [
  {
    "currentItem": {details of the item from the current diet that needs to be replaced},
    "substituteItem": {details of the item that can be substituted. If there is no substitution, keep it null},
    "reason": "reason for removing that item"
  }
]

Return ONLY a valid JSON object without any explanations, comments, or extra formatting. Ensure the JSON is valid.
`;

    return prompt;
}


export function getExercisePlanSuggestPrompt(userDetails) {
    // TODO: Complete this function
}

//* Diet plan analysis
export async function getGptResponseForDietAnalysis(prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: "system",
                    content:
                        "You are a highly knowledgeable and friendly nutrition assistant. Your role is to analyze the user's diet plan, provide insights on the nutritional balance, and suggest potential improvements. Focus on aspects like fats, carbohydrates, Protein, calories, and overall health. Tailor your feedback based on dietary preferences or goals like weight loss, muscle gain, or maintaining a balanced diet."
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
        console.log("Caught error in getGptResponseForDietAnalysis() helper func due to ");
        console.error(err);
        return null;
    }
}


export async function getDietPlanAnalysisPrompt(userDetails, dietPlan) {
    const prompt = `
        User details:${JSON.stringify(userDetails)}

        Diet plan:${JSON.stringify(dietPlan)}

        Based on my details, analyze my diet plan and provide a nutritional breakdown for each meal (breakfast, lunch, snacks, dinner). The analysis should include the following:
        
        - A detailed list of all food items for each meal type (breakfast, lunch, snacks, dinner).
        - Nutritional values for each item, including fats, carbohydrates, protein, and total calories (kcal).
        - Constructive feedback for current meal type, listing only the negative aspects.
        - At last there should be a field named 'align', which represents the overall alignment of the diet plan with the user's details. This number should indicate how closely the diet aligns with the user's requirements, with higher numbers indicating better alignment.


        The response should be a single JSON object containing 4 attributes: 'breakfast', 'lunch', 'snacks', and 'dinner' and a field named 'align', which represents the overall alignment of the diet plan with the user's details. This number should indicate how closely the diet aligns with the user's requirements, with higher numbers indicating better alignment. . Each attribute should contain the following structure:
        
        {
            "plan": [ // list of items related to this meal_type which is current object key
                {
                    "name": "name of the food item",
                    "quantity": "quantity from the provided diet plan",
                    "fats": "total fats in grams",
                    "carbs": "total carbohydrates in grams",
                    "protein": "total protein in grams",
                    "kcal": "total calories in kcal"
                },
                ...
            ],
            "feedback": [
                "Bullet-points. Constructive feedback for current meal type, listing only the negative aspects (i.e., where the diet is lacking or needs improvement)."
            ],
            "improvement_required": "Number, indicating the percentage (as a number) of how much improvement is required for that specific meal's nutritional alignment."
        }

        Return ONLY a valid JSON object without any explanations, comments, or extra formatting. Ensure the JSON is valid.
    `
    return prompt;
}