import express from "express";
import { updateUserProfileDetails } from "../controller/user_profile/controller.js";

const router = express.Router();

router.post('/v1/save', updateUserProfileDetails);

export default router
