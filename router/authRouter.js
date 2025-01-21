import express from "express";
import { verifyToken, signUserToken, addCoinsToUser, getReferralCode, handleReferral } from "../controller/auth/controller.js";
import { verifyToken as verifyTokenMiddleware } from "../middleware/verifyToken.js";

const router = express.Router();

// Route for signing a user token
router.post('/v1/sign', signUserToken);
// Route for verifying a user token
router.get('/v1/verify', verifyTokenMiddleware, verifyToken);
router.post('/v1/addCoins', addCoinsToUser);
router.get('/v1/referral', verifyTokenMiddleware , getReferralCode);
// Route for handling referrals
router.post('/v1/refer', verifyTokenMiddleware, handleReferral);

export default router;