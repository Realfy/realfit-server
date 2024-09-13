import express from "express";
import { verifyToken, signUserToken } from "../controller/auth/controller.js";
import { verifyToken as verifyTokenMiddleware } from "../middleware/verifyToken.js";

const router = express.Router();

// Route for signing a user token
router.post('/v1/sign', signUserToken);
// Route for verifying a user token
router.get('/v1/verify', verifyTokenMiddleware, verifyToken);

export default router;