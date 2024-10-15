import jsonwebtoken from 'jsonwebtoken';
import { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } from '../../envConfig.js';
import db from "../../config/firestoreConfig.js";
import { fireStoreCollections } from "../../utils/collection/firestore.js";

export async function signUserToken(req, res) {
    const { sign } = jsonwebtoken;

    try {
        const { userId, email } = req.body;
        if (!userId) {
            return res.status(400).json({code: 0, message: "Please provide user id."})
        }
        if (!email)
            return res.status(400).json({ code: 0, message: "Please provide user email," });
        const payload = {
            email: email,
            userId: userId
        }
        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            await userRef.set({
                email: email
            });
        }
        const accessToken = sign(payload, JWT_ACCESS_TOKEN_SECRET, {
            expiresIn: "1h"
        });
        const refreshToken = sign(payload, JWT_REFRESH_TOKEN_SECRET, {
            expiresIn: "30d"
        });
        const data = {
            accessToken: accessToken, refreshToken
        };
        return res.status(200).json({ code: 1, message: "User signed in successfully.", data });
    }
    catch (err) {
        console.log("Caught error in controller.authController() due to ");
        console.log(err)
        return res.status(500).json({ code: -1, message: "Failed to sign user. Please try again" });
    }
}


export async function verifyToken(req, res) {
    const data = req.payload;
    return res.status(200).json({ code: 1, message: "User verified successfully.", data: data });
}
