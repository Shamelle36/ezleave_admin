import express from "express";
import { getLeaveRequests } from "../controllers/leaveRequestController.js";

const router = express.Router();

router.get("/", getLeaveRequests);

export default router;
