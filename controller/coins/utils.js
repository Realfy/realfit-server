import db from "../../config/firestoreConfig.js";
import { fireStoreCollections } from "../../utils/collection/firestore.js";


export async function redeemOpeningCoupon() {
    try {
        return { code: 1, message: 'Coupon redeemed.' };
    }
    catch (err) {
        console.log("Caught exception in controller.utils.redeemOpeningCoupon(): ");
        console.error(err);
        return { code: -1, message: "Failed to redeem coupon. Please try again!" };
    }
}


export async function chargeCoinsForAI(userId, date_data, coins, reason, description, relatedId, in_or_out) {
    try {
        if (typeof coins === 'string')
            coins = parseInt(coins);
        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            let availableCoins = userData.coins.available;
            if (userData.coins && !isNaN(availableCoins)) {
                if (typeof availableCoins === 'string')
                    availableCoins = parseInt(availableCoins);
                if (availableCoins >= coins) {
                    const updatedCoins = availableCoins - coins;
                    const coinsHistoryRef = userRef.collection(fireStoreCollections.userData.subCollections.coinsHistory.title);
                    const newTransaction = {
                        date: date_data.created_at,
                        for: reason,
                        relatedId: relatedId,
                        charge: in_or_out * coins,
                        used: false,
                        description: description
                    };

                    await db.runTransaction(async (t) => {
                        t.update(userRef, {
                            'coins.available': updatedCoins
                        });

                        t.set(coinsHistoryRef.doc(date_data.historyId), newTransaction);
                    });

                    return { code: 1, message: "Coins charged successfully." };
                }
                else
                    return { code: 0.5, message: "Insufficient coins." };
            }
            else
                return { code: 0.5, message: "Insufficient coins or no coins exist." };
        }
        else {
            return { code: 0, message: "User not found." };
        }
    }
    catch (err) {
        console.log("Caught exception in controller.utils.chargeCoinsFor(): ");
        console.error(err);
        return { code: -1, message: "Failed to charge coins. Please try again!" };
    }
}


export async function revokeChargedCoinsForAI(userId, historyId, coinsToRefund) {
    try {
        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const coinsHistoryRefIsExist = userRef.collection(fireStoreCollections.userData.subCollections.coinsHistory.title).doc(historyId + "_refund");
        const coinsHistoryDocIsExist = await coinsHistoryRefIsExist.get();
        if (coinsHistoryDocIsExist.exists)
            return { code: 1, message: `Successfully refunded ${coinsToRefund} coins and removed the transaction.` }
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            let availableCoins = userData.coins ? userData.coins.available : 0;
            if (typeof availableCoins === 'string')
                availableCoins = parseInt(availableCoins);

            const coinsHistoryRef = userRef.collection(fireStoreCollections.userData.subCollections.coinsHistory.title);
            await db.runTransaction(async (t) => {
                const updatedCoins = availableCoins + coinsToRefund;

                t.update(userRef, {
                    'coins.available': updatedCoins
                });

                const newTransaction = {
                    date: new Date(),
                    for: "refunded",
                    relatedId: historyId,
                    charge: coinsToRefund,
                    description: `Amount refunded regarding transaction with ID ${historyId}`
                };

                t.set(coinsHistoryRef.doc(historyId + "_refund"), newTransaction);
            });
            return { code: 1, message: `Successfully refunded ${coinsToRefund} coins and removed the transaction.` };
        }
        else {
            return { code: 0, message: "User not found." };
        }
    }
    catch (err) {
        console.log("Caught exception in controller.utils.revokeChargedCoinsForAI(): ");
        console.error(err);
        return { code: -1, message: "Failed to add your coins back to wallet. Please contact our support!" };
    }
}


export async function updateTransactionAsChargedAfterAI(userId, historyId) {
    try {
        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const historyRef = userRef.collection(fireStoreCollections.userData.subCollections.coinsHistory.title).doc(historyId);
        const historyDoc = await historyRef.get();
        if (historyDoc.exists) {
            await historyRef.update({
                used: true
            });
        }
    }
    catch (err) {
        console.log("Caught exception in controller.utils.updateTransactionAsChargedAfterAI(): ");
        console.error(err);
    }
}


export async function verifyHistoryIdExist(userId, historyId) {
    try {
        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const historyRef = userRef.collection(fireStoreCollections.userData.subCollections.coinsHistory.title).doc(historyId);
        const historyDoc = await historyRef.get();
        if (historyDoc.exists) {
            const docData = historyDoc.data();
            return !docData.used;
        }
        return false;
    }
    catch (err) {
        console.log("Caught exception in controller.utils.verifyHistoryIdExist(): ");
        console.error(err);
        return false;
    }
}

export async function getCoinsTransactionListUtil(userId, limit=10, offset=0) {
    try {
        const userRef = db.collection(fireStoreCollections.userData.title).doc(userId);
        const userDoc = await userRef.get();
        if (userDoc) {
            const available = userDoc.data().coins.available || 0;
            const historyRef = userRef.collection(fireStoreCollections.userData.subCollections.coinsHistory.title)
                .orderBy("date", "desc")
                .limit(limit)
                .offset(offset);
            const data = await historyRef.get();
            const transactions = []
            data.forEach(doc => (transactions.push({ id:doc.id, ...doc.data() })));
            return { status: 200, code: 1, data: { available: available, history: [...transactions] }, message: "Transaction list fetched." };
        }
        else
            return {status: 404, code: 0, message: "User not found."}
    }
    catch (err) {
        console.log("Caught exception in controller.utils.getCoinsTransactionList(): ");
        console.error(err);
        return {status: 5200, code: -1, message: "Failed to get transaction list. Please try again!"}
    }
}



export function generateReferralCoupon(userId) {
    // Generate a random uppercase letter (from ASCII 65 to 90)
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));

    // Get the last 5 characters of the userId
    const lastFive = userId.slice(-5);

    // Generate a random 3-digit number (from 100 to 999)
    const randomNumber = Math.floor(100 + Math.random() * 900);

    return `${randomLetter}${lastFive}${randomNumber}`.toUpperCase();
}


export function generateTransactionId() {
    const created_at = new Date();
    const timestamp = created_at.getFullYear().toString() +
        (created_at.getMonth() + 1).toString().padStart(2, '0') +
        created_at.getDate().toString().padStart(2, '0') +
        created_at.getHours().toString().padStart(2, '0') +
        created_at.getMinutes().toString().padStart(2, '0') +
        created_at.getSeconds().toString().padStart(2, '0');
    const randomComponent = Buffer.from(Math.floor(Math.random() * 1000000).toString().padStart(6, '0').toString()).toString('base64');
    const historyId = `TXN-${timestamp}-${randomComponent}`;
    return historyId;
}