import { chat, getMessagesListInThread } from '../controller/chatbot/controller.js';
import express from 'express'

const router = express.Router();

router.post('/v1/response', chat);

router.get('/v1/list', getMessagesListInThread);

export default router;