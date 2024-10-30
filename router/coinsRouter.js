import express from 'express'
import { handleChargeCoinsForAI, getCoinsTransactionList, handleCouponRedeem, addNewCoupon, generateOrGetReferralCoupon } from '../controller/coins/controller.js';

const router = express.Router();

router.post("/v1/ai/charge", handleChargeCoinsForAI);
router.get("/v1/history", getCoinsTransactionList);

router.post('/v1/coupon', handleCouponRedeem);
router.put('/v1/coupon', addNewCoupon);
router.get('/v1/coupon/referral', generateOrGetReferralCoupon);

export default router;