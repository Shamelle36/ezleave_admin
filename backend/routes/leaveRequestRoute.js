import express from "express";
import { getLeaveRequests, getLeaveRequestsCount, approveLeaveRequest, rejectLeaveRequest } from "../controllers/leaveRequestController.js";

const router = express.Router();

router.get("/", getLeaveRequests);
router.get("/count", getLeaveRequestsCount);
router.patch('/:id/approve', approveLeaveRequest);
router.patch('/:id/reject', rejectLeaveRequest);

export default router;
