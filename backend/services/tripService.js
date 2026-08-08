// Trip management service handling database CRUD operations, date formatting, pagination, and photo attachment updates

import Trip from '../models/tripModel.js';
import ApiError from '../utils/ApiError.js';

// Normalizes input payload before persisting to database
const formatIncomingData = (data) => {
  const formatted = { ...data };
  return formatted;
};

// Formats outgoing trip object dates into clean YYYY-MM-DD strings
const formatOutgoingTrip = (trip) => {
  if (!trip) return trip;
  const doc = trip.toObject ? trip.toObject() : trip;
  
  if (doc.startDate instanceof Date) doc.startDate = doc.startDate.toISOString().split("T")[0];
  if (doc.endDate instanceof Date) doc.endDate = doc.endDate.toISOString().split("T")[0];
  
  return doc;
};

class TripService {
  // Creates and saves a new trip itinerary for a specified user
  async createTrip(userId, tripData) {
    const formattedData = formatIncomingData(tripData);
    formattedData.userId = userId;

    // Convert string inputs to explicit boolean flags
    formattedData.laundry = formattedData.laundry === true || formattedData.laundry === "Yes";
    formattedData.shopping = formattedData.shopping === true || formattedData.shopping === "Yes";
    formattedData.photographyGear = formattedData.photographyGear === true || formattedData.photographyGear === "Yes";
    formattedData.workLaptop = formattedData.workLaptop === true || formattedData.workLaptop === "Yes";

    const trip = new Trip(formattedData);
    await trip.save();
    return formatOutgoingTrip(trip);
  }

  // Retrieves paginated trip records belonging to a specified user
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

  // Fetches single trip by ID for a specific user
  async getTripById(tripId, userId) {
    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) throw new ApiError(404, "Trip not found");
    return formatOutgoingTrip(trip);
  }

  // Updates existing trip record
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

  // Deletes a trip record by ID
  async deleteTrip(tripId, userId) {
    const trip = await Trip.findOneAndDelete({ _id: tripId, userId });
    if (!trip) throw new ApiError(404, "Trip not found");
    return true;
  }

  // Appends uploaded image URL paths to a trip's photo gallery array
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

