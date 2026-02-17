import { Router } from "express";
import auth from "../../middleware/auth.middleware";
import validateRequest from "../../middleware/validateRequest";
import { USER_ROLE } from "../user/user.constant";
import { authValidation } from "./auth.validation"; 
import { authControllers } from "./user.controller";
import { authServices } from "./user.service";
import upload from "../../middleware/fileUpload";



const router = Router();

router.post('/userRegistration',validateRequest(authValidation.requestOtpZodSchema), authControllers.userRegistration,);
router.post('/verifyEmail',validateRequest(authValidation.verifyEmailZodSchemar), authControllers.verifyEmailController,);
router.post('/setPassword',validateRequest(authValidation.setPasswordValidationSchema), authControllers.setPasswordController,);
router.post('/login',validateRequest(authValidation.loginZodSchema), authControllers.login,);
router.post( '/refresh-token',validateRequest(authValidation.refreshTokenValidationSchema),authControllers.refreshToken,);
router.post('/google', authControllers.googleLogin);
router.post('/appleLogin', authControllers.appleLogin);

router.post('/codeVerification', authControllers.codeVerification,);
router.post('/userVerifyOtp', authControllers.verifyOtpController,);

router.patch('/change-password',auth(USER_ROLE.agencies, USER_ROLE.influencer),upload.none(),authControllers.changePassword,);
router.patch('/reset-password', authControllers.resetPassword);



//forget password এর জন্য OTP পাঠানোর route
// router.post('/send-otp',validateRequest(authValidation.requestOtpZodSchema), authControllers.sendOtp,);
// router.post('/verify-otp',validateRequest(authValidation.verifyEmailZodSchemar), authControllers.verifyOtpOnly,);
// router.patch('/forget-password', authServices.verifyOtpAndResetPassword,);



export const authRoutes = router;
