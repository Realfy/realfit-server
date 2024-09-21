import express from 'express'
import { getExercisePlanWithAI } from '../controller/exercise/controller.js';

const router = express.Router();

router.get('/plan', getExercisePlanWithAI);

export default router;