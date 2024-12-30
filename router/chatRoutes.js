//sridhar

import express from 'express';
import { chat, getMessagesListInThread } from '../controller/chatbot/chatController.js';
import { verifyJWT } from '../utils/jwt.js';

const router = express.Router();

// Define route for creating a chat
router.post('/addChat', verifyJWT, chat);

// Define route for getting messages in a thread
router.get('/api/chats/:id', verifyJWT, getMessagesListInThread);

export default router;
