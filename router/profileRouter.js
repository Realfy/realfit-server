import express from "express";
import { updateUserProfileDetails } from "../controller/user_profile/controller.js";

const router = express.Router();

//TODO: Complete this controller
router.post('/v1/update', updateUserProfileDetails);

export default router