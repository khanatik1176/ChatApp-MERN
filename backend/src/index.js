import express from 'express';
import authRoutes from './routes/auth.route.js';
import dotenv from 'dotenv';
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';

const app = express(); // Create an Express application instance

dotenv.config(); // Load environment variables from .env file
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cookieParser()); // This will extract JSON data from incoming requests
app.use("/api/auth", authRoutes); // Mount the auth routes at /api/auth

app.listen(PORT, () => 
{
    console.log('Server is running on port:', PORT);
    connectDB(); // Connect to the database when the server starts
})