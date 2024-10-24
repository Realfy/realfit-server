import express from "express";
import {
    getDietPlanAnalysis,
    getDietPlanList,
    getDietPlanWithAI,
    getDietPlanWithId,
    getLatestDietTemplate,
    getTemplateById,
    saveCurrentDayDietPlan,
    saveLatestDietPlanTemplate
} from "../controller/diet/controller.js";

const router = express.Router();

router.post('/v1/suggest', getDietPlanWithAI);
router.post('/v1/analyze', getDietPlanAnalysis);

router.post('/v1/current/save', saveCurrentDayDietPlan);
router.post('/v1/template/save', saveLatestDietPlanTemplate);

// Retrieve data
router.get('/v1/template/recent', getLatestDietTemplate);
router.get('/v1/template/:id', getTemplateById);
router.get('/v1/current/list', getDietPlanList);
router.get('/v1/current/:id', getDietPlanWithId);

export default router;