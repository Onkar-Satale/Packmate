import tripService from '../services/tripService.js';

export const createTrip = async (req, res, next) => {
  try {
    const trip = await tripService.createTrip(req.userId, req.body);
    res.status(201).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

export const getUserTrips = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    const tripsResult = await tripService.getUserTrips(req.userId, page, limit);
    res.json({ success: true, ...tripsResult });
  } catch (err) {
    next(err);
  }
};

export const getTrip = async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.id, req.userId);
    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

export const updateTrip = async (req, res, next) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.userId, req.body);
    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

export const deleteTrip = async (req, res, next) => {
  try {
    await tripService.deleteTrip(req.params.id, req.userId);
    res.json({ success: true, message: "Trip deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const uploadPhotos = async (req, res, next) => {
  try {
    const uploadedFiles = req.files.map((file) => file.path);
    const photos = await tripService.uploadPhotos(req.params.id, req.userId, uploadedFiles);
    res.json({ success: true, data: { photos } });
  } catch (err) {
    next(err);
  }
};

export const updateNotes = async (req, res, next) => {
  try {
    const notes = await tripService.updateNotes(req.params.id, req.userId, req.body.notes);
    res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
};
