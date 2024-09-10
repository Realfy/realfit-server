import { readItems } from "@directus/sdk";
import client from "../../config/getDirectusClient.js";
import { directusCollections } from "../../directus/collections.js";

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
                        { exercise_muscle_group_id: ['title', { category : ['title']}] }
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
        console.log(err);
        console.log("Caught exception in controller.directus.exercise.getExercisesFromCmsBasedOnMuscleGroup() due to " + err);
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
        console.log("Caught error in controller.directus.exercise.controller() due to");
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
        console.log("Caught exception in controller.directus.exercise.getExerciseDataFromCmsWithFilters() due to");
        console.log(err)
        return response.status(500).json({ code: -1, message: "Failed to get exercise data" })
    }
}


// TODO: Get list of exercises with AI