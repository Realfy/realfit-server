import express from "express";
import { getDietPlanWithCaloriesCount, getItemsListFromCMS } from "../../controller/diet/controller.js";

const router = express.Router();

router.get("/plan", getDietPlanWithCaloriesCount);
router.get('/list', getItemsListFromCMS);

export default router;