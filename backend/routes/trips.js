import express from 'express';
import auth from '../middlewares/auth.js';
import { upload } from '../config/cloudinary.js';
import * as tripController from '../controllers/tripController.js';
import { tripValidator, updateTripValidator, tripNotesValidator } from '../validators/tripValidator.js';

const router = express.Router();

router.post("/", auth, tripValidator, tripController.createTrip);
router.get("/", auth, tripController.getUserTrips);
router.get("/:id", auth, tripController.getTrip);
router.put("/:id", auth, updateTripValidator, tripController.updateTrip);
router.delete("/:id", auth, tripController.deleteTrip);
router.put("/:id/upload", auth, upload.array("photos"), tripController.uploadPhotos);
router.put("/:id/notes", auth, tripNotesValidator, tripController.updateNotes);

export default router;
