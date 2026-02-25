import { Router } from 'express';
import auth from '../../middleware/auth.middleware';
import { driverController  } from './driver.controller';
import upload from '../../middleware/fileUpload';



const router = Router();

router.post('/createDriver',auth('agencies'), driverController.createDriver);
router.post('/upload-image',auth('agencies'), upload.single('file'), driverController.uploadDriverImage);

// router.patch('/location/by-address',auth(),driverController.updateDriverLocationByAddress);

router.get("/coordinates", driverController.getCoordinatesController);
router.get("/distance-time", driverController.getDistanceTimeController);
router.get("/autocomplete", driverController.getAutoCompleteController);
router.get("/captains-radius", driverController.getCaptainsInRadiusController);
router.post("/reverse-geocode", driverController.getAddressFromCoordinatesController);

// POST /api/maps/exact-address
router.post("/exact-address", driverController.getExactStreetAddressController);


export const driverRoutes = router;
