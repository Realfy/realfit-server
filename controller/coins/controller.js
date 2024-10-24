import { coinsCharge } from "../../utils/coins/charge.js";
import { chargeCoinsForAI, getCoinsTransactionListUtil } from "./utils.js";

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

        const timestamp = created_at.getFullYear().toString() +
            (created_at.getMonth() + 1).toString().padStart(2, '0') +
            created_at.getDate().toString().padStart(2, '0') +
            created_at.getHours().toString().padStart(2, '0') +
            created_at.getMinutes().toString().padStart(2, '0') +
            created_at.getSeconds().toString().padStart(2, '0');
        const randomComponent = Buffer.from(Math.floor(Math.random() * 1000000).toString().padStart(6, '0').toString()).toString('base64');
        const historyId = `TXN-${timestamp}-${randomComponent}`;

        const coinsToCharge = coinsCharge.aiWorkoutPlan;
        const userId = req.payload.userId;
        const chargeResponse = await chargeCoinsForAI(userId, { created_at, historyId }, coinsToCharge,
            service, description, null, -1);
        if (chargeResponse.code != 1) {
            const chargeResponseCode = chargeResponse.code;
            const status = chargeResponseCode == 0 ? 404 : chargeResponseCode == -1 ? 500 : 402;
            return res.status(status).json(chargeResponse);
        }
        return res.status(200).json({ ...chargeResponse, data: {transactionId: historyId} });
    }
    catch (err) {
        console.log("Caught exception in controller.coins.handleChargeCoinsForAI(): ");
        console.error(err);
        return res.status(500).json({code: -1, message: "Failed to charge coins. Please try again!"})
    }
}

export async function getCoinsTransactionList(req, res) {
    try {
        const userId = req.payload.userId;
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.skip) || 0;
        const response = await getCoinsTransactionListUtil(userId, limit, offset);
        return res.status(response.status).json({code: response.code, message: response.message, data: response?.data});
    }
    catch (err) {
        console.log("Caught exception in controller.coins.getCoinsTransactionList(): ");
        console.error(err);
        return res.status(500).json({ code: -1, message: "Failed to get transaction list. Please try again!" })
    }
}