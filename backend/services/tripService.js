import Trip from '../models/Trip.js';
import ApiError from '../utils/ApiError.js';

// Map frontend `peoples` backwards to DB `travelers` and vice versa
const formatIncomingData = (data) => {
  const formatted = { ...data };
  if (formatted.peoples !== undefined) {
    formatted.travelers = formatted.peoples;
  }
  // Ensure dates are parsed properly if not handled automatically via express-validator format
  return formatted;
};

const formatOutgoingTrip = (trip) => {
  if (!trip) return trip;
  const doc = trip.toObject ? trip.toObject() : trip;
  if (doc.travelers) {
    doc.peoples = doc.travelers;
  }
  
  // Format dates cleanly without the T00:00:00.000Z backend signature
  if (doc.startDate instanceof Date) doc.startDate = doc.startDate.toISOString().split("T")[0];
  if (doc.endDate instanceof Date) doc.endDate = doc.endDate.toISOString().split("T")[0];
  
  return doc;
};

class TripService {
  async createTrip(userId, tripData) {
    const formattedData = formatIncomingData(tripData);
    formattedData.userId = userId;
    
    // Fallback normalization
    formattedData.destination = formattedData.destination || formattedData.location;
    formattedData.totalDays = formattedData.totalDays || formattedData.days;

    // Formatting for nested properties
    formattedData.laundry = formattedData.laundry === true || formattedData.laundry === "Yes";
    formattedData.shopping = formattedData.shopping === true || formattedData.shopping === "Yes";
    formattedData.photographyGear = formattedData.photographyGear === true || formattedData.photographyGear === "Yes";
    formattedData.workLaptop = formattedData.workLaptop === true || formattedData.workLaptop === "Yes";

    const trip = new Trip(formattedData);
    await trip.save();
    return formatOutgoingTrip(trip);
  }

  async getUserTrips(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const trips = await Trip.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const totalItems = await Trip.countDocuments({ userId });

    return {
      data: trips.map(formatOutgoingTrip),
      page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems
    };
  }

  async getTripById(tripId, userId) {
    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) throw new ApiError(404, "Trip not found");
    return formatOutgoingTrip(trip);
  }

  async updateTrip(tripId, userId, updateData) {
    const formattedData = formatIncomingData(updateData);
    const trip = await Trip.findOneAndUpdate(
      { _id: tripId, userId },
      formattedData,
      { new: true, runValidators: true }
    );
    if (!trip) throw new ApiError(404, "Trip not found");
    return formatOutgoingTrip(trip);
  }

  async deleteTrip(tripId, userId) {
    const trip = await Trip.findOneAndDelete({ _id: tripId, userId });
    if (!trip) throw new ApiError(404, "Trip not found");
    return true;
  }

  async uploadPhotos(tripId, userId, photoPaths) {
    const trip = await Trip.findOneAndUpdate(
      { _id: tripId, userId },
      { $push: { photos: { $each: photoPaths } } },
      { new: true }
    );
    if (!trip) throw new ApiError(404, "Trip not found");
    return trip.photos;
  }
}

export default new TripService();
