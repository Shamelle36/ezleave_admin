import express from "express";
import { createAnnouncement, getAnnouncements } from "../controllers/announcementController.js";

const router = express.Router();

// Get all announcements
router.get("/", getAnnouncements);

// Post new announcement
router.post("/", createAnnouncement);

export default router;
