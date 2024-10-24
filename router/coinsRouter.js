import express from 'express'
import { handleChargeCoinsForAI, getCoinsTransactionList } from '../controller/coins/controller.js';

const router = express.Router();

router.post("/v1/ai/charge", handleChargeCoinsForAI);
router.get("/v1/history", getCoinsTransactionList);

export default router;