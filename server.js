import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import client from "./config/getDirectusClient.js";
import { readItems } from "@directus/sdk";

dotenv.config();

// Create Express app
const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());

// Set application to use env variables from development
dotenv.config({ path: ".env.development" });

const PORT = process.env.PORT || 5431;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
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