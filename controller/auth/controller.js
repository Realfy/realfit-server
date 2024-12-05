import jsonwebtoken from "jsonwebtoken";
import db from "../../config/firestoreConfig.js";
import {
	JWT_ACCESS_TOKEN_SECRET,
	JWT_REFRESH_TOKEN_SECRET,
} from "../../envConfig.js";
import { fireStoreCollections } from "../../utils/collection/firestore.js";

export async function signUserToken(req, res) {
	const { sign } = jsonwebtoken;

	try {
		const { userId, email } = req.body;
		if (!userId) {
			return res
				.status(400)
				.json({ code: 0, message: "Please provide user id." });
		}
		if (!email)
			return res
				.status(400)
				.json({ code: 0, message: "Please provide user email," });
		const payload = {
			email: email,
			userId: userId,
		};
		const userRef = db
			.collection(fireStoreCollections.userData.title)
			.doc(userId);
		const userDoc = await userRef.get();
		if (!userDoc.exists) {
			await userRef.set({
				email: email,
				coins: {
					available: 0,
				},
			});
		}
		const accessToken = sign(payload, JWT_ACCESS_TOKEN_SECRET, {
			expiresIn: "1h",
		});
		const refreshToken = sign(payload, JWT_REFRESH_TOKEN_SECRET, {
			expiresIn: "30d",
		});
		const data = {
			accessToken: accessToken,
			refreshToken,
		};
		return res
			.status(200)
			.json({ code: 1, message: "User signed in successfully.", data });
	} catch (err) {
		console.log("Caught error in controller.authController() due to ");
		console.log(err);
		return res.status(500).json({
			code: -1,
			message: "Failed to sign user. Please try again",
		});
	}
}

export async function verifyToken(req, res) {
	const data = req.payload;
	return res
		.status(200)
		.json({ code: 1, message: "User verified successfully.", data: data });
}

export async function addCoinsToUser(req, res) {
    console.log("Received request to add coins.");
    try {
        const { email, coins } = req.body;

        if (!email) {
            return res.status(400).json({ code: 0, message: "Email is required." });
        }
        if (!coins || coins.available === undefined) {
            return res.status(400).json({ code: 0, message: "Coins data is required." });
        }

        const emailNormalized = email.trim().toLowerCase();
        const availableCoins = coins.available;

        console.log(`Normalized email: "${emailNormalized}"`);
        console.log(`Available coins: ${availableCoins}`);

        const userCollection = db.collection(fireStoreCollections.userData.title);

        // Log all documents for debugging
        const allDocs = await userCollection.get();
        console.log("All users in the collection:");
        allDocs.forEach((doc) => {
            console.log(`Document ID: ${doc.id}, Email: "${doc.data().email}"`);
        });

        // Query for the specific email
        const querySnapshot = await userCollection
            .where("email", "==", emailNormalized)
            .get();

        if (querySnapshot.empty) {
            console.log(`No user found with email: "${emailNormalized}"`);
            return res.status(404).json({ code: 0, message: "User not found." });
        }

        // Update the user's coins
        const updates = querySnapshot.docs.map(async (doc) => {
            const userRef = userCollection.doc(doc.id);
            const currentData = doc.data();

            console.log(`Existing user data: ${JSON.stringify(currentData)}`);

            await userRef.update({
                "coins.available": availableCoins,
            });

            console.log(`Coins updated for user: "${emailNormalized}"`);
        });

        await Promise.all(updates);

        return res.status(200).json({
            code: 1,
            message: "Coins added successfully to the user.",
        });
    } catch (error) {
        console.error("Error adding coins field:", error);
        return res.status(500).json({
            code: -1,
            message: "Failed to add coins. Please try again.",
        });
    }
}
