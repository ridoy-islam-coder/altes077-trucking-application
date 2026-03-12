import { Router } from "express";
import { withdrawAmount } from "./withdraw.controller";


const router = Router();

// Driver withdraw
router.post("/", withdrawAmount);

export const WithdrawRoutes = router;