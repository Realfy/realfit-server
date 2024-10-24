import { readItems } from "@directus/sdk";
import db from "../../config/firestoreConfig.js";
import client from "../../config/getDirectusClient.js";
import { directusCollections } from '../../directus/collections.js';
import { caloriesDistribution } from "../../helpers/dietCaloriesDistribution.js";
import {
    getDietPlanAnalysisPrompt,
    getDietPlanSuggestPrompt,
    getGptResponse,
    getGptResponseForDietAnalysis
} from "../../helpers/getGptResponse.js";
import { validateDietPlanItem, validateDietPreferencesObject } from "../../helpers/validators.js";
import { coinsCharge } from "../../utils/coins/charge.js";
import { fireStoreCollections } from "../../utils/collection/firestore.js";
import { revokeChargedCoinsForAI, updateTransactionAsChargedAfterAI, verifyHistoryIdExist } from "../coins/utils.js";

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

// get diet plan analysis with AI
export async function getDietPlanAnalysis(req, res) {
    try {
        const userDetails = req.body.details;
        if (!userDetails) {
            return res.status(400).json({ code: 0, message: "Please provide user details." });
        }
        const dietPlan = req.body.plan;
        if (!dietPlan || !Array.isArray(dietPlan)) {
            return res.status(400).json({ code: 0, message: "Please provide valid diet plan." });
        }
        const prompt = await getDietPlanAnalysisPrompt(userDetails, dietPlan);
        const response = await getGptResponseForDietAnalysis(prompt);
        const data = [];
        for (const element of response.choices) {
            const analysis = element.message.content
            const analysisObject = JSON.parse(analysis);
            data.push(analysisObject);
        }
        return res.status(200).json({ code: 1, message: "Your diet plan is analyzed", data: data })
    }
    catch (err) {
        console.log("Caught exception in controller.diet.controller.getDietPlanAnalysis due to ");
        console.error(err);
        return res.status(500).json({ code: -1, message: "Failed to suggest diet plan with AI." });
    }
}

// Suggest diet plan based on user preferences with help of AI (GPT-4o-mini).
// TODO: Replace user details with actual data.
export async function getDietPlanWithAI(req, res) {
    const coinsToCharge = coinsCharge.aiDietPlan;
    const userId = req.payload.userId;
    const historyId = req.body.transactionId;
    const { userDescription, dietaryType, purpose, caloriesGoal, allergies, currentDietPlan, cuisine } = req.body;
    if (!purpose)
        return res.status(400).json({ code: 0, message: "Please provide purpose." });

    if (!currentDietPlan || typeof currentDietPlan != 'object')
        return res.status(400).json({ code: 0, message: "Please provide valid user's current diet plan." });

    if (!historyId)
        return res.status(400).json({ code: 0, message: "Please provide transaction ID." });

    const userDetailsBody = {
        userDescription: userDescription || null,
        dietaryType: dietaryType || null,
        purpose: purpose || null,
        caloriesGoal: caloriesGoal || null,
        allergies: allergies || null,
        currentDietPlan: currentDietPlan || null,
        cuisine: cuisine || null
    };
    // const userDetails = Object.entries(userDetailsBody)
    //     .reduce((acc, [key, value]) => {
    //         if (value !== null) {
    //             acc[key] = value;
    //         }
    //         return acc;
    //     }, {});

    try {
        const transactionExists = await verifyHistoryIdExist(userId, historyId);
        if (!transactionExists)
            return res.status(402).json({ code: 0, message: "Transaction not found or has already been used for the provided history ID." });
        const prompt = getDietPlanSuggestPrompt(userDetailsBody);
        const response = await getGptResponse(prompt);
        if (response == null)
            throw { statusCode: 400, code: 0 };
        const data = [];
        for (const element of response.choices) {
            const dietPlan = element.message.content
            const dietPlanObject = JSON.parse(dietPlan);
            data.push(dietPlanObject);
        }
        updateTransactionAsChargedAfterAI(userId, historyId);
        return res.status(200).json({ code: 1, data: data });
    }
    catch (err) {
        let message = "Failed to suggest diet plan with AI.";
        const statusCode = err.statusCode ? err.statusCode : 500;
        let code = err.code ? err.code : -1;
        const revokeResponse = await revokeChargedCoinsForAI(userId, historyId, coinsToCharge);
        if (revokeResponse.code != 1) {
            message = "Failed to suggest diet plan with AI and unable to refund the coins.";
        }
        console.log("Caught exception in controller.diet.controller.getDietPlanWithAI due to ");
        console.error(err);
        return res.status(statusCode).json({ code: code, message: message });
    }
}


// Test route to check model efficiency with variable user data
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


//* Diet item schema
/*
{
    id: 'some id',
    title: 'some title',
    quantity_taken: 'some quantity (in grams)',
    calories: 'some calories (in k.cal)',
    meal_type: 'some meal type (either breakfast, lunch, snacks, dinner, pre-workout, post-workout)'
}
*/
export async function saveCurrentDayDietPlan(req, res) {
    try {
        let userId = req.payload.userId;
        if (!isNaN(userId))
            userId = "" + userId;
        // Request body payload
        const { plan, template_id } = req.body;
        if (!plan || !Array.isArray(plan) || plan.length == 0) {
            return res.status(400).json({ code: 0, message: 'Please provide valid diet plan' });
        }

        // Validate template_id
        if (!template_id || template_id.length == 0) {
            return res.status(400).json({ code: 0, message: "Please provide valid template id for current diet." });
        }

        // Validate diet plan objects
        const validateDietPlanResponse = validateDietPlanItem(plan);
        if (validateDietPlanResponse.code != 1) {
            return res.status(400).json({ code: validateDietPlanResponse.code, message: validateDietPlanResponse.message });
        }
        const currDate = new Date();
        const key = currDate.getFullYear() + "" + String(currDate.getMonth() + 1).padStart(2, '0') + "" + String(currDate.getDate()).padStart(2, '0');
        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ code: 0, message: 'User not found.' })
        }
        const dietRef = userRef.collection(fireStoreCollections.userData.subCollections.diet.everyDayPlan.title).doc(key);
        await dietRef.set({
            data: plan,
            date: currDate
        }, { merge: true });
        return res.status(200).json({ code: 1, message: 'Current day diet plan saved.' });
    }
    catch (err) {
        console.log("Caught error in controller.diet.controller.saveCurrentDayDietPlan() due to");
        console.error(err);
        return res.status(500).json({ code: -1, message: 'Failed to save diet plan.' });
    }
}


// TODO: Find a way to trigger this method, either directly after AI generating this plan and call it from client
export async function saveLatestDietPlanTemplate(req, res) {
    try {
        const SOURCE_BY = ['self', 'ai', 'expert'];
        let { source, plan, id, updated_at, created_at, preferences } = req.body;
        let userId = req.payload.userId;

        if (!isNaN(userId)) {
            userId = "" + userId;
        }

        // Validate request body
        if (!source || !plan || !id || !preferences) {
            return res.status(400).json({ code: 0, message: "Source, diet plan, and id fields are required." });
        }

        // Validate source object
        if (!source || typeof source !== 'object') {
            return res.status(400).json({ code: 0, message: 'Source must be an object with `by` (required) and `data` fields.' });
        }

        if (!source.by) {
            return res.status(400).json({ code: 0, message: 'Source object should contain `by` field.' });
        }

        if (!SOURCE_BY.includes(source.by)) {
            return res.status(400).json({ code: 0, message: `Invalid source.by value. Must be one of: ${SOURCE_BY.join(', ')}` });
        }

        if (source.by === 'expert' && !source.data) {
            // TODO: Validate data filed incase of expert that to add expert id, template_id (incase of global), etc.. (Discuss with Jayanth)
            return res.status(400).json({ code: 0, message: 'In case of plan suggested by expert, their data must be provided.' });
        }

        // Validate plan
        if (!Array.isArray(plan) || plan.length === 0) {
            return res.status(400).json({ code: 0, message: 'Please provide a valid non-empty diet plan.' });
        }

        // Validate diet plan items
        const validateDietPlanResponse = validateDietPlanItem(plan);
        if (validateDietPlanResponse.code !== 1) {
            return res.status(400).json({ code: validateDietPlanResponse.code, message: validateDietPlanResponse.message });
        }

        //* validate preferences
        if (!preferences || typeof preferences !== 'object') {
            return res.status(400).json({ code: 0, message: 'Please provide a valid non-empty preferences.' });
        }
        let { dietary_type, cuisine, allergies } = preferences;
        if (!dietary_type && !allergies && !cuisine) {
            return res.status(400).json({ code: 0, message: 'Please provide at least one of the following: dietary type, allergies, or current diet preferences.' });
        }
        if (typeof dietary_type === 'string')
            dietary_type = dietary_type.toLowerCase();
        const validateDietPreferencesObjectResponse = validateDietPreferencesObject({ dietaryType: dietary_type, allergies: allergies, cuisine: cuisine })
        if (validateDietPreferencesObjectResponse.code != 1)
            return res.status(400).json({ code: validateDietPreferencesObjectResponse.code, message: validateDietPreferencesObjectResponse.message });

        // Validate dates
        if (updated_at && isNaN(Date.parse(updated_at))) {
            return res.status(400).json({ code: 0, message: 'Invalid updated_at date format.' });
        }

        if (updated_at && !created_at) {
            return res.status(400).json({ code: 0, message: 'Please provide created_at date incase of update_at field is mentioned.' });
        }

        if (created_at && isNaN(Date.parse(created_at))) {
            return res.status(400).json({ code: 0, message: 'Invalid created_at date format.' });
        }

        if (!updated_at)
            updated_at = new Date();
        if (!created_at)
            created_at = new Date();

        // Data to store
        const data = { source, plan, created_at, updated_at, preferences };

        // Save diet plan template
        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists)
            return res.status(404).json({ code: 0, message: 'User not found.' });

        const dietTemplateDoc = userRef.collection(fireStoreCollections.userData.subCollections.diet.dietTemplate.title).doc(id);
        const saved = await dietTemplateDoc.set(data, { merge: true });
        console.log(saved)

        return res.status(200).json({ code: 1, message: 'Diet template saved successfully.' });
    } catch (err) {
        console.error('Caught error in controller.diet.controller.saveLatestDietPlanTemplate: ', err);
        return res.status(500).json({ code: -1, message: 'Failed to save diet plan template.' });
    }
}


export async function getLatestDietTemplate(req, res) {
    try {
        let userId = req.payload.userId;
        if (!isNaN(userId))
            userId = "" + userId;
        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ code: 0, message: 'User not found.' })
        }
        const latestDoc =
            userRef.collection(fireStoreCollections.userData.subCollections.diet.dietTemplate.title)
                .orderBy('updated_at', 'desc')
                .limit(1)
                .get()
        if (!latestDoc.empty) {
            const docData = latestDoc.docs[0].data();
            return res.status(200).json({ code: 1, message: "Returned recently updated diet plan template.", data: docData });
        }
        return res.status(404).json({ code: 0, message: "No diet plan template found" });
    }
    catch (err) {
        console.log("Caught error in controller.diet.controller.getLatestDietTemplate() due to: ");
        console.error(err);
        return res.json({ code: -1, message: "Failed to get latest diet plan template." })
    }
}


export async function getTemplateById(req, res) {
    try {
        const id = req.params.id;
        if (!id)
            return res.status(400).json({ code: 0, message: "Please provide valid template id." });
        let userId = req.payload.userId;
        if (!isNaN(userId))
            userId = "" + userId;
        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ code: 0, message: 'User not found.' })
        }
        const templateDoc = await userRef.collection(fireStoreCollections.userData.subCollections.diet.dietTemplate.title).doc(id).get();
        if (templateDoc.exists) {
            const templateData = templateDoc.data();
            return res.status(200).json({ code: 1, message: "Returned requested template.", data: templateData });
        }
        return res.status(404).json({ code: 0, message: "No template found." });
    }
    catch (err) {
        console.log("Caught error in controller.diet.controller.getTemplateById() due to: ");
        console.error(err);
        return res.json({ code: -1, message: "Failed to get requested diet template." })
    }
}


export async function getDietPlanWithId(req, res) {
    try {
        let userId = req.payload.userId;
        if (!isNaN(userId))
            userId = "" + userId;
        const id = req.params.id || null;
        if (!id) {
            return res.status(400).json({ code: 0, message: 'Please provide valid diet plan ID.' });
        }
        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ code: 0, message: 'User not found.' })
        }
        const dietPlanDoc =
            await userRef.collection(fireStoreCollections.userData.subCollections.diet.everyDayPlan.title).doc(id).get()
        if (dietPlanDoc.exists) {
            const docData = dietPlanDoc.data();
            return res.status(200).json({ code: 1, message: "Returned diet plan with given ID.", data: docData });
        }
        return res.status(404).json({ code: 0, message: "No diet plan found with the given ID." });
    }
    catch (err) {
        console.log("Caught error in controller.diet.controller.getDietPlanWithId() due to: ");
        console.error(err);
        return res.json({ code: -1, message: "Failed to get requested diet plan." })
    }
}


export async function getDietPlanList(req, res) {
    try {
        let userId = req.payload.userId;
        if (!isNaN(userId))
            userId = "" + userId;

        const limit = parseInt(req.query.limit) || 15;
        const skip = parseInt(req.query.skip) || 0;

        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ code: 0, message: 'User not found.' })
        }
        const dietPlanQuery = userRef.collection(fireStoreCollections.userData.subCollections.diet.everyDayPlan.title)
            .orderBy('date', 'desc')
            .limit(limit)
            .offset(skip);

        const dietPlanDoc = await dietPlanQuery.get();

        if (!dietPlanDoc.empty) {
            const docData = dietPlanDoc.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return res.status(200).json({ code: 1, message: "Returned diet plan list", data: docData });
        }
        return res.status(404).json({ code: 0, message: "No diet plans found." });
    }
    catch (err) {
        console.log("Caught error in controller.diet.controller.getDietPlanList() due to: ");
        console.error(err);
        return res.json({ code: -1, message: "Failed to get diet plan list" })
    }
}