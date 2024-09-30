import express from "express";
import { getExercisesFromCmsBasedOnMuscleGroup, getExerciseGroupsAndCategories, getExerciseDataFromCmsWithFilters } from "../../controller/exercise/controller.js";
import exerciseRouter from '../exericseRouter.js';
import { verifyToken } from "../../middleware/verifyToken.js";

const router = express.Router();

router.get("/list/groups", getExerciseGroupsAndCategories);

router.get('/list/filter', getExerciseDataFromCmsWithFilters);

router.get('/list/muscle/:target', getExercisesFromCmsBasedOnMuscleGroup);

//TODO: Add middleware here `verifyToken`
router.use('', exerciseRouter);

export default router;