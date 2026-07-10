const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { upload } = require("../config/cloudinary");
const tripController = require("../controllers/tripController");
const { tripValidator, updateTripValidator, tripNotesValidator } = require("../validators/tripValidator");

router.post("/", auth, tripValidator, tripController.createTrip);
router.get("/", auth, tripController.getUserTrips);
router.get("/:id", auth, tripController.getTrip);
router.put("/:id", auth, updateTripValidator, tripController.updateTrip);
router.delete("/:id", auth, tripController.deleteTrip);
router.put("/:id/upload", auth, upload.array("photos"), tripController.uploadPhotos);
router.put("/:id/notes", auth, tripNotesValidator, tripController.updateNotes);

module.exports = router;
