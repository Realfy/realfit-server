import db from "../../config/firestoreConfig.js";
import axios from 'axios';
import * as admin from 'firebase-admin';

export async function chat(req, res) {
	try {
		console.log("inside chat");

		if (
			!req.body.data ||
			typeof req.body.data !== "string" ||
			req.body.data.trim() === ""
		) {
			return res.status(400).json({
				code: 0,
				message: "Please initiate chat with valid input",
			});
		}

		// Check if threadId is passed, otherwise create a new thread
		const threadAvailable = req.body.threadId && req.body.threadId !== null;
		let threadId = threadAvailable ? req.body.threadId : null;

		// Create a new thread if none is provided
		if (!threadAvailable) {
			threadId = `thread_${Date.now()}`; // Generate a unique thread ID (e.g., based on current time)
		} else {
			// Check if the chat document exists for the provided threadId
			const chatDoc = await db.collection("chats").doc(threadId).get();
			if (!chatDoc.exists) {
				// If the document does not exist, create a new thread
				threadId = `thread_${Date.now()}`; // Generate a new thread ID
			}
		}

		// Send the user's message to OpenAI
		const openAIResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
			model: 'gpt-3.5-turbo', // Specify the model you want to use
			messages: [{ role: 'user', content: req.body.data }],
		}, {
			headers: {
				'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Use your OpenAI API key
				'Content-Type': 'application/json',
			},
		});

		const aiMessage = openAIResponse.data.choices[0].message.content; // Extract the AI's response

		// Fetch the existing chat document
		const chatDoc = await db.collection("chats").doc(threadId).get();
		let conversation = [];

		if (chatDoc.exists) {
			// If the document exists, get the current conversation
			conversation = chatDoc.data().conversation || [];
		}

		// Create a single message entry that contains both the user's question and the AI's response
		const combinedMessage = {
			message: {
				question: req.body.data,
				answer: aiMessage,
				timestamp: new Date().toISOString(),
			}
		};

		// Append the combined message to the conversation
		conversation.push(combinedMessage);

		// Save the updated conversation back to Firestore
		await db.collection("chats").doc(threadId).set({
			threadId: threadId,
			user: req.user.userId,
			conversation: conversation,
			createdAt: new Date().toISOString(),
		}, { merge: true }); // Use merge to update existing document

		res.status(200).json({
			code: 1,
			message: "Chat updated successfully",
			data: { thread_id: threadId },
		});
	} catch (err) {
		console.error("Caught error in chatController.chat() due to:", err);
		const message =
			process.env.NODE_ENV === "production"
				? "Failed to process request."
				: `Error: ${err.message}`;
		res.status(500).json({ code: -1, message });
	}
}

export async function getMessagesListInThread(req, res) {
	try {
		const id = req.query.id;
		if (!id) {
			return res.status(400).json({
				code: 0,
				message: "Please provide a valid thread id.",
			});
		}

		// Fetch the conversation for the provided thread ID
		const chatDoc = await db.collection("chats").doc(id).get();

		if (!chatDoc.exists) {
			return res.status(404).json({
				code: 0,
				message: "Thread not found.",
			});
		}

		const data = chatDoc.data().conversation;

		res.status(200).json({
			code: 1,
			message: "Chat retrieved successfully",
			data,
		});
	} catch (err) {
		console.error(
			"Caught error in chatController.getMessagesListInThread() due to:",
			err
		);
		const message =
			process.env.NODE_ENV === "production"
				? "Failed to process request."
				: `Error: ${err.message}`;
		res.status(500).json({ code: -1, message });
	}
}
