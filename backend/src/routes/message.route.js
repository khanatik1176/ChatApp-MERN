import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { editMessage, getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.post ("/update/:id", protectRoute, editMessage);

export default router;
