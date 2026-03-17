import { Request, Response } from "express";
import { withdrawService } from "./withdraw.service";


// export const withdrawMoney = async (req: Request, res: Response) => {
//   try {
//     const driverId = req.user.id; // token থেকে driver ID
//     const { amount } = req.body;

//     if (!amount || amount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid withdraw amount",
//       });
//     }

//     const withdraw = await withdrawService(driverId, amount);

//     res.json({
//       success: true,
//       message: "Withdraw successful",
//       data: withdraw,
//     });

//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


export const withdrawMoney = async (req: Request, res: Response) => {
  try {
    const driverId = req.user.id; // JWT token থেকে driver userId
    const { amount } = req.body;

    // 1️⃣ Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdraw amount",
      });
    }

    // 2️⃣ Call withdraw service
    const withdraw = await withdrawService(driverId, amount);

    // 3️⃣ Success response
    res.status(200).json({
      success: true,
      message: "Withdraw successful",
      data: withdraw,
    });

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};