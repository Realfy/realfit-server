import { readItems } from "@directus/sdk";
import client from "../../config/getDirectusClient.js";
import { directusCollections } from "../../directus/collections.js";
import { getExercisePlanSuggestPrompt, getGptResponseForWorkoutPlan } from "../../helpers/getGptResponse.js";

// Get list of all the exercises based on target muscle group
export async function getExercisesFromCmsBasedOnMuscleGroup(req, res) {
    try {
        const target = req.params.target || null;
        if (target == null || !target) {
            return res.status(400).json({ code: 0, message: 'Please provide target muscle group' });
        }
        const list = await client.request(readItems(directusCollections.exercise, {
            fields: ['id', 'title', 'purpose', 'training_level', 'sets', 'reps',
                {
                    muscle_group: [
                        { exercise_muscle_group_id: ['title', { category: ['title'] }] }
                    ]
                }, 'video_preview', { images: ['directus_files_id'] },
                'equipment_required', 'description'
            ],
            filter: {
                muscle_group: {
                    exercise_muscle_group_id: { title: { _icontains: target } }
                }
            }
        }));
        return res.status(200).json({ code: 1, data: list });
    }
    catch (err) {
        console.log("Caught exception in controller.exercise.getExercisesFromCmsBasedOnMuscleGroup() due to " + err);
        console.log(err);
        return res.status(500).json({ code: -1, message: "Failed to get exercises based on muscle group." });
    }
}


// Get list of exercise groups along with categories
export async function getExerciseGroupsAndCategories(req, res) {
    try {
        const list = await client.request(readItems(directusCollections.exerciseMuscleGroup, {
            fields: ['id', 'title', { category: ['title'] }]
        }));
        return res.status(200).json({ code: 1, message: "List fetched successfully.", data: list });
    }
    catch (err) {
        console.log("Caught error in controller.exercise.controller() due to");
        console.log(err);
        res.status(500).json({ code: -1, message: "Failed to get of exercise groups and its categories" });
    }
}


// Get list of exercises based on filters (level, purpose nd muscle group) from CMS
export async function getExerciseDataFromCmsWithFilters(request, response) {
    try {
        const level = request.query.level || null;
        const purpose = request.query.purpose || null;
        const muscleStr = request.query.muscle || null;  // All the values separated by comma
        let muscleFilters = []
        const muscle = muscleStr == null ? [] : muscleStr.split(',') || [];
        if (muscle.length > 0) {
            muscleFilters = muscle.map((muscleType) => ({
                muscle_group: {
                    exercise_muscle_group_id: {
                        title: { _icontains: muscleType }
                    }
                }
            }));
        }
        const filters = {};
        if (level != null && level.length > 0) {
            filters.training_level = { _icontains: level };
        }
        if (purpose != null && purpose.length > 0) {
            filters.purpose = { _icontains: purpose };
        }
        if (muscleFilters.length > 0) {
            filters._or = muscleFilters;
        }
        const result = await client.request(readItems(directusCollections.exercise, {
            fields: ['id', 'title', 'purpose', 'training_level', 'sets', 'reps',
                {
                    muscle_group: [
                        { exercise_muscle_group_id: ['title', { category: ['title'] }] }
                    ]
                }, 'video_preview', { images: ['directus_files_id'] },
                'equipment_required', 'description'
            ],
            filter: filters
        }));
        return response.status(200).json({ code: 1, data: result });
    }
    catch (err) {
        console.log("Caught exception in controller.exercise.getExerciseDataFromCmsWithFilters() due to");
        console.log(err)
        return response.status(500).json({ code: -1, message: "Failed to get exercise data" })
    }
}


export async function getExercisePlanWithAI(req, res) {
    try {
        const { workoutDays, injuries, exerciseLevel, workoutType, userWeight, userHeight, equipmentLevel } = req.body;
        if (!workoutDays || isNaN(workoutDays) || workoutDays < 1 || workoutDays > 7)
            return res.status(400).json({ code: 0, message: 'Please number of days user workouts in a week. This value should lie between 1 to 7.' });
        if (!exerciseLevel)
            return res.status(400).json({ code: 0, message: 'Please provide level of your exercise.' });

        if (!workoutType || !Array.isArray(workoutType) || workoutType.length == 0)
            return res.status(400).json({ code: 0, message: 'Please provide type of user workout. This arrays length should be greater than 1.' });

        if (!injuries)
            return res.status(400).json({ code: 0, message: 'Please provide valid injuries data.' });

        if (!userWeight || isNaN(userWeight))
            return res.status(400).json({ code: 0, message: 'Please provide your weight in kg.' });

        if (!userHeight || isNaN(userHeight))
            return res.status(400).json({ code: 0, message: 'Please provide your height in cm.' });

        if (!equipmentLevel)
            return res.status(400).json({ code: 0, message: 'Please provide the level of equipment available.' });

        const userDetails = {};
        userDetails.workoutDays = workoutDays
        userDetails.injuries = injuries
        userDetails.exerciseLevel = exerciseLevel
        userDetails.workoutType = workoutType;
        userDetails.userWeight = userWeight;
        userDetails.userHeight = userHeight;
        userDetails.equipmentLevel = equipmentLevel;

        const cmsData = await client.request(readItems(directusCollections.exercise, {
            fields: ['id', 'title']
        }));
        const prompt = getExercisePlanSuggestPrompt(userDetails, cmsData);
        const response = await getGptResponseForWorkoutPlan(prompt);
        if (response == null)
            return res.status(400).json({ code: 0, message: "An error occurred while getting diet plan from AI." });
        const data = [];
        for (const element of response.choices) {
            const dietPlan = element.message.content
            const dietPlanObject = JSON.parse(dietPlan);
            data.push(dietPlanObject);
        }
        return res.status(200).json({ code: 1, data: data, message: "Workout plan generated with AI." });
    }
    catch (err) {
        console.log("Caught exception in controller.exercise.getExercisePlanWithAI() due to");
        console.log(err)
        return res.status(500).json({ code: -1, message: "Failed to get exercise plan with AI." });
    }
}


export async function getExerciseIdAndTitleFromCMS(req, res) {
    try {
        const data = await client.request(readItems(directusCollections.exercise, {
            fields: ['id', 'title']
        }));
        return res.status(200).json({ code: 1, data: data });
    }
    catch (err) {
        console.log("Caught error in controller.exercise.getExerciseIdAndTitleFromCMS() due to: ");
        console.error(err);
        return res.status(500).json({ code: -1, message: "Failed to get exercises list from CMS." });
    }
}