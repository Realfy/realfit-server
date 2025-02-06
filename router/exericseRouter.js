import express from 'express'
import { getExercisePlanWithAI, getExerciseTemplate, saveExerciseTemplate } from '../controller/exercise/controller.js';

const router = express.Router();

router.post('/v1/plan', getExercisePlanWithAI);
router.post('/v1/template/save',saveExerciseTemplate);
router.get('/v1/template/get',getExerciseTemplate);

export default router;