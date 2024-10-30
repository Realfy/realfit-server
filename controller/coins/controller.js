import db from "../../config/firestoreConfig.js";
import { REFERRAL_COINS, REFERRAL_LIMIT } from "../../envConfig.js";
import { coinsCharge } from "../../utils/coins/charge.js";
import { fireStoreCollections } from "../../utils/collection/firestore.js";
import { chargeCoinsForAI, generateReferralCoupon, generateTransactionId, getCoinsTransactionListUtil } from "./utils.js";

export async function handleChargeCoinsForAI(req, res) {
    try {
        let { service, description } = req.body;
        if (!service || (service != 'ai_workout_plan' && service != 'ai_diet_plan' && service != 'ai_chatbot'))
            return res.status(400).json({ code: 0, message: "Please provide valid service details." });
        if (!description) {
            if (service == 'ai_workout_plan')
                description = "Personalized workout plan generated using AI."
            else if (service == 'ai_diet_plan')
                description = "Tailored diet plan created with AI assistance."
            else
                description = "Interactive chatbot session that consumes usage coins."
        }
        const created_at = new Date();
        const historyId = generateTransactionId();

        const coinsToCharge = coinsCharge.aiWorkoutPlan;
        const userId = req.payload.userId;
        const chargeResponse = await chargeCoinsForAI(userId, { created_at, historyId }, coinsToCharge,
            service, description, null, -1);
        if (chargeResponse.code != 1) {
            const chargeResponseCode = chargeResponse.code;
            const status = chargeResponseCode == 0 ? 404 : chargeResponseCode == -1 ? 500 : 402;
            return res.status(status).json(chargeResponse);
        }
        return res.status(200).json({ ...chargeResponse, data: { transactionId: historyId } });
    }
    catch (err) {
        console.log("Caught exception in controller.coins.handleChargeCoinsForAI(): ");
        console.error(err);
        return res.status(500).json({ code: -1, message: "Failed to charge coins. Please try again!" })
    }
}

export async function getCoinsTransactionList(req, res) {
    try {
        const userId = req.payload.userId;
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.skip) || 0;
        const response = await getCoinsTransactionListUtil(userId, limit, offset);
        return res.status(response.status).json({ code: response.code, message: response.message, data: response?.data });
    }
    catch (err) {
        console.log("Caught exception in controller.coins.getCoinsTransactionList(): ");
        console.error(err);
        return res.status(500).json({ code: -1, message: "Failed to get transaction list. Please try again!" })
    }
}

export async function handleCouponRedeem(req, res) {
    try {
        const userId = req.payload.userId;
        const { coupon } = req.body;
        if (!coupon || typeof coupon !== 'string') {
            return res.status(400).json({ code: 0, message: "Invalid coupon." })
        }
        const couponRef = db.collection(fireStoreCollections.coupons.title).doc(coupon);
        const couponDoc = await couponRef.get();
        if (!couponDoc.exists) {
            return res.status(400).json({ code: 0, message: "Invalid coupon." });
        }
        const couponData = couponDoc.data();
        if (couponData.createdBy == userId)
            return res.status(400).json({ code: 0, message: "You cannot redeem a coupon that you created." });
        const redeemedListCount = (await couponRef.collection(fireStoreCollections.coupons.subCollections.redeemedBy.title).count().get()).data();
        // Check if the coupon has reached its maximum redemption limit
        if (couponData.limit <= redeemedListCount.count) {
            return res.status(400).json({ code: 0, message: "Coupon usage limit reached." });
        }
        const current_date = new Date();
        if (couponData.type !== 'referral') {
            const expire_at = couponData.expireAt.toDate();
            // Incase of coupon expired
            if (current_date > expire_at) {
                return res.status(400).json({ code: 0, message: "Coupon expired" });
            }
        }
        const redeemedRef = couponRef.collection(fireStoreCollections.coupons.subCollections.redeemedBy.title)
        const userSnapshot = await redeemedRef.where('userId', '==', userId).get();
        // If user already redeemed this coupon
        if (!userSnapshot.empty) {
            return res.status(400).json({ code: 0, message: "You have already redeemed this coupon." });
        }
        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const userDoc = await userRef.get();
        // In case of user doesn't exist. (May be due to invalid access token)
        if (!userDoc.exists) {
            return res.status(404).json({ code: 0, message: "User not found." });
        }

        const historyId = generateTransactionId();
        const userData = userDoc.data();
        const couponCoins = typeof couponData.coins === 'string' ? parseInt(couponData.coins) : couponData.coins;
        let availableCoins = userData.coins.available || 0;
        if (typeof availableCoins === 'string')
            availableCoins = parseInt(availableCoins);

        await db.runTransaction(async (t) => {
            // Update user available coins. If that field not exist then create.
            t.update(userRef, {
                'coins.available': availableCoins + couponCoins
            });
            const coinsHistoryRef = userRef.collection(fireStoreCollections.userData.subCollections.coinsHistory.title);
            const newTransaction = {
                date: current_date,
                for: couponData.type,
                relatedId: coupon,
                charge: couponCoins,
                used: true,
                description: couponData.description
            };
            // Save current transaction in history.
            t.set(coinsHistoryRef.doc(historyId), newTransaction);
            // Add coupon redemption in coupon's history sub collection
            const data = {
                userId: userId,
                date: current_date
            }
            t.set(redeemedRef.doc(historyId), data);
            // Update coins in coupon owner account incase of coupon redeemed is of type `referral`
            if (couponData.type === 'referral') {
                const couponOwnerRef = db.collection(fireStoreCollections.userData.title).doc(couponData.createdBy);
                t.update(couponOwnerRef, {
                    'coins.available': availableCoins + couponCoins
                });
                const couponOwnerCoinsHistoryRef = couponOwnerRef.collection(fireStoreCollections.userData.subCollections.coinsHistory.title);
                const couponOwnerNewTransaction = {
                    date: current_date,
                    for: couponData.type,
                    relatedId: coupon,
                    charge: couponCoins,
                    used: true,
                    description: `You earned coins for referring a friend! ${couponData?.description}`
                };
                // Save transaction in owner coins history
                t.set(couponOwnerCoinsHistoryRef.doc(historyId), couponOwnerNewTransaction);
            }
        });
        return res.status(200).json({ code: 1, message: "Coupon redeemed successfully." });
    }
    catch (err) {
        console.log("Caught exception in controller.coins.handleCouponRedeem(): ");
        console.error(err);
        return res.status(500).json({ code: -1, message: "Failed to redeem coupon. Please try again!" })
    }
}

export async function addNewCoupon(req, res) {
    try {
        // expires_in value must be a number indicating for how many hours this coupon will be valid after its creation.
        let { coupon, expires_in, coins, limit, description } = req.body;
        const userId = req.payload.userId;
        const userRole = req.payload.role;
        if (!description)
            description = null;
        if (!userRole || userRole !== 'admin') {
            return res.status(401).json({ code: 0, message: "Only admin can add new coupon." });
        }
        let type = 'general';
        if (!coupon || typeof coupon !== 'string') {
            return res.status(400).json({ code: 0, message: "Please provide valid coupon code." });
        }
        if (coupon.length < 5) {
            return res.status(400).json({ code: 0, message: "Length of coupon code should be at least 5 characters." });
        }
        if (!limit || isNaN(limit)) {
            return res.status(400).json({ code: 0, message: "Please provide valid limit value." });
        }
        if (!coins || isNaN(coins)) {
            return res.status(400).json({ code: 0, message: "Please provide number of coins for coupon." });
        }
        if (typeof limit !== "number")
            limit = parseInt(limit);
        if (typeof coins !== "number")
            coins = parseInt(coins);

        const created_at = new Date();
        let expiresAt = null;
        if (!expires_in || isNaN(expires_in)) {
            return res.status(400).json({ code: 0, message: "Please provide an expires_in value in hours." });
        }
        expiresAt = new Date(created_at.getTime() + expires_in * 60 * 60 * 1000); // Adds expires_in hours in milliseconds

        const data = {
            createdBy: userId,
            createdAt: created_at,
            expireAt: expiresAt,
            coins: coins,
            type: type,
            limit: limit,
            description: description
        }
        const couponRef = db.collection(fireStoreCollections.coupons.title).doc(coupon);
        const couponDoc = await couponRef.get();
        if (couponDoc.exists) {
            return res.status(400).json({ code: 0, message: "Coupon with given code already exists." });
        }
        // Save the coupon
        await db.collection(fireStoreCollections.coupons.title).doc(coupon).set(data);
        data.coupon = coupon;
        return res.status(201).json({ code: 1, message: "Coupon created successfully.", data: data });
    }
    catch (err) {
        console.log("Caught exception in controller.coins.addNewCoupon(): ");
        console.error(err);
        return res.status(500).json({ code: -1, message: "Failed to add new coupon. Please try again!" })
    }
}

export async function generateOrGetReferralCoupon(req, res) {
    try {
        const userId = req.payload.userId;
        let couponRef = await db.collection(fireStoreCollections.coupons.title)
            .where('createdBy', '==', userId)
            .where('type', '==', 'referral')
            .get();
        let coupon = '', limit = parseInt(REFERRAL_LIMIT), free = parseInt(REFERRAL_LIMIT);
        if (couponRef.empty) {
            const currDate = new Date();
            const data = {
                createdBy: userId,
                createdAt: currDate,
                expireAt: null,
                coins: REFERRAL_COINS,
                type: 'referral',
                limit: REFERRAL_LIMIT,
                description: 'Referral coupon to invite other users.'
            }

            coupon = generateReferralCoupon(userId);
            await db.collection(fireStoreCollections.coupons.title).doc(coupon).set(data);
        }
        else {
            coupon = couponRef.docs[0].id;
            // Update referral
            const existingData = couponRef.docs[0].data();
            if (typeof existingData.coins === 'string')
                existingData.coins = parseInt(existingData.coins);
            if (typeof existingData.limit === 'string')
                existingData.coins = parseInt(existingData.limit);

            if (existingData.limit !== parseInt(REFERRAL_LIMIT) || existingData.coins !== parseInt(REFERRAL_COINS)) {
                await db.collection(fireStoreCollections.coupons.title).doc(coupon).update({
                    limit: parseInt(REFERRAL_LIMIT),
                    coins: parseInt(REFERRAL_COINS)
                });
            }
            // Calculate remaining uses
            const couponHistory = await db.collection(fireStoreCollections.coupons.title)
                .doc(coupon)
                .collection(fireStoreCollections.coupons.subCollections.redeemedBy.title)
                .count()
                .get();
            free = limit - couponHistory.data().count;
            console.log(free)
        }
        return res.status(200).json({
            code: 1,
            message: "Coupon generated successfully.",
            data: {
                coupon: coupon,
                limit: limit,
                free: free
            }
        });
    }
    catch (err) {
        console.log("Caught exception in controller.coins.generateOrGetReferralCoupon(): ");
        console.error(err);
        return res.status(500).json({ code: -1, message: "Failed to get referral coupon. Please try again!" })
    }
}