import express from "express";
import { saveUserDietPreferences, saveUserExercisePreferences } from "../controller/preferences/controller.js";

const router = express.Router();

router.post('/v1/diet', saveUserDietPreferences);
router.post('/v1/exercise', saveUserExercisePreferences);

export default router;