import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import client from "./config/getDirectusClient.js";
import { readItems } from "@directus/sdk";
import { PORT } from "./envConfig.js";
import cookieParser from "cookie-parser";
import { verifyToken as verifyTokenMiddleware } from './middleware/verifyToken.js';


// Create Express app
const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(cookieParser());


const port = PORT || 5431;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Test route
app.post('/', async (req, res) => {
    const result = await client.request(readItems('item', {
        fields: ['*', { images: ['directus_files_id'] }]
    }))
    res.json(result);
});


// Diet routes
import dietRouter from './router/directus/dietRouter.js';
app.use('/api/diet', dietRouter);

// Exercise routes
import exerciseRouter from './router/directus/exerciseRouter.js'
app.use('/api/exercise', exerciseRouter);


// Auth routes
import authRouter from './router/authRouter.js';
app.use('/api/auth', authRouter);


// Profile routes
import profileRouter from './router/profileRouter.js';
app.use('/api/user/profile', verifyTokenMiddleware, profileRouter);