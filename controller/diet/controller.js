import { readItems } from "@directus/sdk";
import client from "../../config/getDirectusClient.js";
import { directusCollections } from '../../directus/collections.js';
import { caloriesDistribution } from "../../helpers/dietCaloriesDistribution.js";
import { getDietPlanSuggestPrompt, getGptResponse } from "../../helpers/getGptResponse.js";


// Get list of all the food products available in our CMS in ascending order of ID
export async function getItemsListFromCMS(req, res) {
    try {
        const offset = req.query.skip || 0;
        const limit = req.query.limit || 20;
        const itemsList = await client.request(readItems(directusCollections.dietFoodProduct, {
            fields: [
                'id', 'title', { dietary_type: ['title'] }, 'meal_type', { images: ['directus_files_id'] },
                'standard_quantity', 'numeric_value', 'measurement_unit', 'allow_partial_quantity',
                'calories', 'protein', 'fat', 'carbohydrates', 'fiber', 'sugar', 'enabled', 'description'
            ],
            offset: offset,
            limit: limit,
            sort: ['meal_type', 'id'],  // Keep `-` before field for descending order
        }));
        return res.status(200).json({ code: 1, data: itemsList, message: "Diet items list fetched successfully" });
    }
    catch (err) {
        console.log(err)
        console.log("Caught exception in controller.diet.getItemsListFromCMS() due to " + err);
        return res.status(500).json({ code: -1, message: "Failed to get list of items from CMS" });
    }
}


// Get diet plain based on user preferences(from database). Get calories as query parameter
// As of now, as user module have been developed get diet plan based on calories count
export async function getDietPlanWithCaloriesCount(req, res) {
    try {
        const total_calories = req.query.calories || null;
        if (total_calories == null || isNaN(total_calories))
            return res.status(400).json({ code: 0, message: 'Please provide calories count' });
        const itemsList = await client.request(readItems(directusCollections.dietFoodProduct, {
            fields:
                ['id', 'title', { dietary_type: ['title'] }, 'meal_type', { images: ['directus_files_id'] },
                    'numeric_value', 'measurement_unit', 'allow_partial_quantity',
                    'calories',// 'protein', 'fat', 'carbohydrates', 'fiber', 'sugar', 'description'
                ]
        }));
        const result = [];
        itemsList.forEach(item => {
            if (item.allow_partial_quantity) {
                item.calories_gain = ((caloriesDistribution[item.meal_type] / 100) * total_calories);
                item.quantity_to_consume = Math.ceil((item.numeric_value / item.calories) * item.calories_gain) + item.measurement_unit;
                delete item.measurement_unit;
                delete item.calories;
                delete item.numeric_value;
                result.push(item);
            }
            else {
                if (Math.ceil((caloriesDistribution[item.meal_type] / 100) * total_calories) % item.calories == 0) {
                    item.quantity_to_consume = (Math.ceil((caloriesDistribution[item.meal_type] / 100) * total_calories) / item.calories) + item.measurement_unit;
                }
            }
        });
        return res.status(200).json({ code: 1, data: result, message: "Diet planed successfully." });
    }
    catch (err) {
        console.log("Caught exception in controller.diet.getDietPlanWithCaloriesCount() due to ");
        console.log(err);
        return res.status(500).json({ code: -1, message: 'Failed to get diet plan' });
    }
}


// Suggest diet plan based on user preferences with help of AI (GPT-4o-mini).
// TODO: Replace user details with actual data.
export async function getDietPlanWithAI(req, res) {
    const userDetails = {
        userDescription: null,
        dietaryType: "Vegan",
        purpose: "Muscle gain",
        caloriesGoal: 2500,
        allergies: ["Nuts", "Curd"],
        currentDietPlan: [] || null,
        availableFoodItems: [] || null
    };
    const prompt = getDietPlanSuggestPrompt(userDetails);
    try {
        const response = await getGptResponse(prompt);
        if (response == null)
            return res.status(400).json({ code: 0, message: "An error occurred while getting diet plan from AI." });
        const data = [];
        for (let i = 0; i < response.choices.length; i++) {
            const dietPlan = response.choices[i].message.content
            const dietPlanObject = JSON.parse(dietPlan);
            data.push(dietPlanObject);
        }
        return res.status(200).json({ code: 1, data: data });
    }
    catch (err) {
        console.log("Caught exception in controller.diet.controller.getDietPlanWithAI() due to ");
        console.error(err);
        return res.status(500).json({ code: -1, message: "Failed to suggest diet plan with AI." });
    }
}

// Test route to check model effciency with variable user data
export async function getDietPlanWithAITest(req, res) {
    const userDetailsBody = {
        userDescription: req.body.userDescription || null,
        dietaryType: req.body.dietaryType || null,
        purpose: req.body.purpose || null,
        caloriesGoal: req.body.caloriesGoal || null,
        allergies: req.body.allergies || null,
        currentDietPlan: req.body.currentDietPlan || null,
        cuisine: req.body.cuisine || null
    };
    const userDetails = Object.entries(userDetailsBody)
        .reduce((acc, [key, value]) => {
            if (value !== null) {
                acc[key] = value;
            }
            return acc;
        }, {});

    const prompt = getDietPlanSuggestPrompt(userDetailsBody);
    try {
        const response = await getGptResponse(prompt);
        if (response == null)
            return res.status(400).json({ code: 0, message: "An error occurred while getting diet plan from AI." });
        const data = [];
        for (let i = 0; i < response.choices.length; i++) {
            const dietPlan = response.choices[i].message.content
            const dietPlanObject = JSON.parse(dietPlan);
            data.push(dietPlanObject);
        }
        return res.status(200).json({ code: 1, data: data });
    }
    catch (err) {
        console.log("Caught exception in controller.diet.controller.getDietPlanWithAITest due to ");
        console.error(err);
        return res.status(500).json({ code: -1, message: "Failed to suggest diet plan with AI." });
    }
}