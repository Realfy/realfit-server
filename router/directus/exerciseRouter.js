import express from "express";
import { getExercisesFromCmsBasedOnMuscleGroup, getExerciseGroupsAndCategories, getExerciseDataFromCmsWithFilters } from "../../controller/exercise/controller.js";

const router = express.Router();

router.get("/list/groups", getExerciseGroupsAndCategories);

router.get('/list/filter', getExerciseDataFromCmsWithFilters);

router.get('/list/muscle/:target', getExercisesFromCmsBasedOnMuscleGroup);


export default router;