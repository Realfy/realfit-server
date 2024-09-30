import express from 'express'
import { getExercisePlanWithAI } from '../controller/exercise/controller.js';

const router = express.Router();

router.post('/plan', getExercisePlanWithAI);

export default router;