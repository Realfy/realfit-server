import express from "express";
import {
    getDietPlanAnalysis,
    getDietPlanList,
    getDietPlanWithAI,
    getDietPlanWithId,
    getLatestDietTemplate,
    getTemplateById,
    saveCurrentDayDietPlan,
    saveLatestDietPlanTemplate,
    saveDietTracker,
    getDietTrackerList
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

//tracker
router.post('/v1/tracker/save', saveDietTracker);
router.get('/v1/tracker/list', getDietTrackerList);
// router.get('/v1/tracker/:id', getDietTrackerWithId);

export default router;