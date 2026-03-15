import { Router } from "express";
import { withdrawMoney } from "./withdraw.controller";
import { USER_ROLE } from "../user/user.constant";
import auth from "../../middleware/auth.middleware";



const router = Router();

// Driver withdraw
router.post("/withdrawMoney",auth(USER_ROLE.DRIVER), withdrawMoney);

export const WithdrawRoutes = router;