import { Router } from 'express';
import auth from '../../middleware/auth.middleware';
import { driverController,   } from './driver.controller';
import upload from '../../middleware/fileUpload';
import { USER_ROLE } from '../user/user.constant';



const router = Router();

router.post('/createDriver',auth('DRIVER'), driverController.createDriver);
// multiple files (max 4)
router.post( "/upload-image", auth('DRIVER'),upload.array('images', 4),driverController.uploadMultipleDriverImages);
// শুধু authenticated user access করতে পারবে
router.get("/all",  driverController.getAllDrivers);
// Authenticated user token লাগবে
router.get("/getme", auth('DRIVER'),driverController.getUserAndDriverData);
router.get("/distance-time",auth( USER_ROLE.USER), driverController.getDistanceTimeController);
router.get("/autocomplete", driverController.getAutoCompleteController);
router.get("/suggestions", driverController.getAutoSuggestions);
router.get("/captains-radius", driverController.getCaptainsInRadiusController);
// router.patch('/location/by-address',auth(),driverController.updateDriverLocationByAddress);
// ✅ Route
router.get("/create-rides", auth(USER_ROLE.USER),driverController.getcalcutorfar  );



// POST /api/maps/exact-address  lat এবং lng দিয়ে ঠিকানা পেতে
router.post("/reverse-geocode", driverController.getAddressFromCoordinatesController);

// POST /api/maps/exact-address  lat এবং lng দিয়ে ঠিকানা পেতে
router.post("/exact-address", driverController.getExactStreetAddressController);
// GET /api/maps/vehicle-types?type=Truck
router.get("/vehicletypes",auth( USER_ROLE.USER), driverController.getDriversByVehicleTypeController);



export const driverRoutes = router;
