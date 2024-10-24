import { validateDietPreferencesObject } from "../../helpers/validators.js";
import db from "../../config/firestoreConfig.js";
import { fireStoreCollections } from "../../utils/collection/firestore.js";


// Save user basic diet preferences like dietary type, allergies and cuisine
export async function saveUserDietPreferences(req, res) {
    try {
        let { dietaryType, allergies, cuisine } = req.body;
        let userId = req.payload.userId;
        if (!isNaN(userId))
            userId = "" + userId;

        if (!dietaryType && !allergies && !cuisine) {
            return res.status(400).json({ code: 0, message: 'Please provide at least one of the following: dietary type, allergies, or current diet preferences.' });
        }

        if (typeof dietaryType === 'string')
            dietaryType = dietaryType.toLowerCase();

        const validateDietPreferencesObjectResponse = validateDietPreferencesObject({dietaryType: dietaryType, allergies: allergies, cuisine: cuisine})
        if (validateDietPreferencesObjectResponse.code != 1)
            return res.status(400).json({ code: validateDietPreferencesObjectResponse.code, message: validateDietPreferencesObjectResponse.message });
        
        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            const dietPreferenceCollectionData = {
            };
            if (dietaryType) {
                dietPreferenceCollectionData.dietaryType = dietaryType;
            }
            if (allergies)
                dietPreferenceCollectionData.allergies = allergies;
            if (cuisine)
                dietPreferenceCollectionData.cuisine = cuisine;

            const preferenceRef = userRef
                .collection(fireStoreCollections.userData.subCollections.preferences.diet.title)
                .doc("data");
            await preferenceRef.set(dietPreferenceCollectionData, {merge: true});
            return res.status(200).json({ code: 1, message: 'Diet preferences updated.' });
        }
        else
            return res.status(404).json({ code: 0, message: 'User not found.' })
    }
    catch (err) {
        console.log("Caught exception in controller.preferences.saveUserDietPreferences() due to ");
        console.log(err);
        return res.status(500).json({ code: -1, message: 'Failed to save diet preferences.' });
    }
}


export async function saveUserExercisePreferences(req, res) {
    try {
        const EXERCISE_LEVEL = ["basic", "intermediate", "advanced"];
        const WORKOUT_TYPE = [
            'gym workouts',
            'calisthenics',
            'home workouts',
            'cardio workouts',
            'strength training',
            'hiit (high-intensity interval training)',
            'crossfit',
            'bodybuilding',
            'yoga',
            'pilates',
            'martial arts / boxing',
            'sports-specific training',
            'mobility and flexibility training',
            'functional training'
        ];
        let userId = req.payload.userId;
        if (!isNaN(userId))
            userId = "" + userId;
        let { injuries, favoriteWorkouts, exerciseLevel, workoutDays, workoutType } = req.body;
        if (typeof exerciseLevel === 'string')
            exerciseLevel = exerciseLevel.toLowerCase();

        if (!injuries && !favoriteWorkouts && !exerciseLevel && !workoutDays)
            return res.status(400).json(
                { code: 0, message: "Please provide at least one of the following: injuries, favoriteWorkouts, exerciseLevel, or workoutDays." }
            );

        if (workoutDays && (isNaN(workoutDays) || workoutDays < 1 || workoutDays > 7))
            return res.status(400).json({ code: 0, message: "Workout days in a week must be between 1 and 7." });

        if (exerciseLevel && !EXERCISE_LEVEL.includes(exerciseLevel))
            return res.status(400).json({ code: 0, message: 'Invalid exercise level. Must be one of: ' + EXERCISE_LEVEL.join(', ') });

        if (injuries && (!Array.isArray(injuries) || !injuries.every(item => typeof item === 'string')))
            return res.status(400).json({ code: 0, message: 'Injuries must be an array of strings' });

        if (workoutType && (!Array.isArray(workoutType) || !workoutType.every(item => { return WORKOUT_TYPE.indexOf(item.toLowerCase())>=0 })))
            return res.status(400).json({ code: 0, message: 'Workout types must be an array of strings' });

        if (favoriteWorkouts && (!Array.isArray(favoriteWorkouts) || !favoriteWorkouts.every(item => typeof item === 'string')))
            return res.status(400).json({ code: 0, message: 'Workouts must be an array of strings' });

        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            const exercisePreferenceData = {};
            if (injuries)
                exercisePreferenceData.injuries = injuries;
            if (favoriteWorkouts)
                exercisePreferenceData.favoriteWorkouts = favoriteWorkouts;
            if (exerciseLevel)
                exercisePreferenceData.exerciseLevel = exerciseLevel;
            if (workoutDays)
                exercisePreferenceData.workoutDays = workoutDays;
            if (workoutType)
                exercisePreferenceData.workoutType = workoutType;

            const preferenceRef = userRef
                .collection(fireStoreCollections.userData.subCollections.preferences.exercise.title)
                .doc("data");
            await preferenceRef.set(exercisePreferenceData, { merge: true });
            return res.status(200).json({ code: 1, message: 'Exercise preferences updated.' });
        }
        else
            return res.status(404).json({ code: 0, message: 'User not found.' })
    }
    catch (err) {
        console.log("Caught exception in controller.preferences.saveUserExercisePreferences() due to ");
        console.log(err)
        return res.status(500).json({ code: -1, message: 'Failed to save exercise preferences.' });
    }
}