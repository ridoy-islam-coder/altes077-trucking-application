import { Router } from 'express';
import auth from '../../middleware/auth.middleware';
import { driverController } from './driver.controller';
import upload from '../../middleware/fileUpload';



const router = Router();

router.post('/createDriver',auth('agencies'), driverController.createDriver);
router.post('/upload-image',auth('agencies'), upload.single('file'), driverController.uploadDriverImage);

router.patch('/location/by-address',auth(),driverController.updateDriverLocationByAddress);





export const driverRoutes = router;
