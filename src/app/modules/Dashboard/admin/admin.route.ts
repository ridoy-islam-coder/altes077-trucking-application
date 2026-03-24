import { Router } from 'express';

import { adminControllers } from './admin.controller';
// import upload from '../../../middleware/fileUpload';
import auth from '../../../middleware/auth.middleware';
import upload from '../../../middleware/fileUpload';

const router = Router();

router.post('/adminRegister', adminControllers.adminRegister);

router.post('/login', adminControllers.adminLogin);
router.get('/me', auth('admin'), adminControllers.getProfile);
                                      //'super_admin'
router.patch('/update-profile',auth('admin', ),   upload.single('image'),
  adminControllers.updateProfile,
 );  //upload.single('image'),
router.patch(
  '/change-password',
  auth('admin', ), //'super_admin'
  adminControllers.changePassword,
);


router.post('/forgot-password', adminControllers.forgotPassword);
router.post('/verify-otp', adminControllers.verifyOtp);
router.post('/reset-password', adminControllers.resetPassword);


// Admin-only routes
router.get("/stats",auth('admin'), adminControllers.getRideStats);
router.get("/drivers",auth('admin'), adminControllers.getAllDrivers);
//driver by user id
router.get( '/by-user/:userId',auth('admin'),adminControllers.getDriverByUserId);
// Driver approval stats count
router.get("/drivers/stats",auth('admin'), adminControllers.getDriverStats);
// Approve or reject driver
router.patch('/approve/:driverId', auth('admin'), adminControllers.approveDriver);
router.patch('/reject/:driverId', auth('admin'), adminControllers.rejectDriver);















export const adminRoutes = router;
