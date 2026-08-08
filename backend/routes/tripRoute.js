// Trip routing declarations handling trip creation, retrieval, updates, deletion, and photo uploads

import express from 'express';
import auth from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';
import * as tripController from '../controllers/tripController.js';
import { tripValidator, updateTripValidator } from '../validators/tripValidator.js';

const router = express.Router();

// Routes for creating new trips and listing user trips
router.post("/", auth, tripValidator, tripController.createTrip);
router.get("/", auth, tripController.getUserTrips);

// Routes for fetching, updating, and deleting individual trip itineraries
router.get("/:id", auth, tripController.getTrip);
router.put("/:id", auth, updateTripValidator, tripController.updateTrip);
router.delete("/:id", auth, tripController.deleteTrip);

// Route for uploading trip photos to Cloudinary
router.put("/:id/upload", auth, upload.array("photos"), tripController.uploadPhotos);

export default router;

