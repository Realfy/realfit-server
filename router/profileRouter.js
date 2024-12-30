import express from "express";
import { updateUserProfileDetails,getUserData } from "../controller/user_profile/controller.js";

const router = express.Router();

router.post('/v1/save', updateUserProfileDetails);
router.get('/v1/get',getUserData)

export default router
