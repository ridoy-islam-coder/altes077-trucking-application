import { Request, Response } from "express";
import { withdrawService } from "../services/withdraw.service";

// Driver withdraw money
export const withdrawAmount = async (req: Request, res: Response) => {
  try {
    const { driverId, amount, stripeAccountId } = req.body;

    if (!driverId || !amount || !stripeAccountId) {
      return res.status(400).json({ success: false, message: "driverId, amount and stripeAccountId required" });
    }

    const withdraw = await withdrawService(driverId, amount, stripeAccountId);

    res.json({ success: true, withdraw });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};





import { Request, Response } from "express";
import { withdrawService } from "../services/withdraw.service";
import { DriverModel } from "../models/driver.model";

// Driver withdraw money (driver only provides amount)
export const withdrawAmount = async (req: Request, res: Response) => {
  try {
    const driverId = req.user.id; // driver token থেকে driverId
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: "amount required" });
    }

    // Fetch stripeAccountId from DB
    const driver = await DriverModel.findById(driverId);
    if (!driver || !driver.stripeAccountId) {
      return res.status(400).json({ success: false, message: "Stripe account not linked" });
    }

    const withdraw = await withdrawService(driverId, amount, driver.stripeAccountId);

    res.json({ success: true, withdraw });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};