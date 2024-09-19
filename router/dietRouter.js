import express from "express";
import { getDietPlanWithAI } from "../controller/diet/controller.js";
    
const router = express.Router();

router.get('/v1/suggest', getDietPlanWithAI);

export default router;