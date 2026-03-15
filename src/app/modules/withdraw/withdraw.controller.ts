import { Request, Response } from "express";
import { withdrawService } from "./withdraw.service";


export const withdrawMoney = async (req: Request, res: Response) => {
  try {
    const driverId = req.user.id; // token থেকে driver ID
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdraw amount",
      });
    }

    const withdraw = await withdrawService(driverId, amount);

    res.json({
      success: true,
      message: "Withdraw successful",
      data: withdraw,
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};