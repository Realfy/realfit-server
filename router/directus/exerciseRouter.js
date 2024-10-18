import express from "express";
import { getExercisesFromCmsBasedOnMuscleGroup, getExerciseGroupsAndCategories, getExerciseDataFromCmsWithFilters, getExerciseIdAndTitleFromCMS } from "../../controller/exercise/controller.js";
import exerciseRouter from '../exericseRouter.js';
import { verifyToken } from "../../middleware/verifyToken.js";

const router = express.Router();

router.get("/list/groups", getExerciseGroupsAndCategories);

router.get('/list/filter', getExerciseDataFromCmsWithFilters);

router.get('/list/muscle/:target', getExercisesFromCmsBasedOnMuscleGroup);

router.get('/list/json', getExerciseIdAndTitleFromCMS);

//TODO: Add middleware here `verifyToken`
router.use('', verifyToken, exerciseRouter);

export default router;