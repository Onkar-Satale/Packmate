import mongoose from 'mongoose';

const TravelerSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  age: { type: Number, min: 0 },
  gender: { type: String, trim: true },
  medicalNotes: { type: String, trim: true }
});

const PackingItemSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  quantity: { type: String, trim: true }
});

const PackingCategorySchema = new mongoose.Schema({
  category: { type: String, trim: true },
  items: [PackingItemSchema]
});

const TripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Trip must belong to a user"]
  },

  // -------- Trip Basics --------
  destination: { type: String, required: [true, "Destination is required"], trim: true },
  startDate: { type: Date, required: [true, "Start date is required"] },
  endDate: { type: Date, required: [true, "End date is required"] },
  totalDays: { type: Number, min: 1 },
  tripType: { type: String, trim: true },

  // -------- Travel & Stay --------
  travelMode: { type: String, trim: true },
  accommodation: { type: String, trim: true },
  roomType: { type: String, trim: true },
  laundry: { type: Boolean, default: false },
  budget: { type: String, trim: true },

  // -------- Lifestyle --------
  weatherSensitivity: { type: String, default: "Normal", trim: true },
  activityLevel: { type: String, default: "Moderate", trim: true },
  shopping: { type: Boolean, default: false },
  photographyGear: { type: Boolean, default: false },
  workLaptop: { type: Boolean, default: false },

  // -------- Food & Health --------
  foodPreference: { type: String, default: "No preference", trim: true },
  dietaryNotes: { type: String, trim: true },
  medicalNotes: { type: String, trim: true },

  // -------- Travelers --------
  kids: { type: Number, default: 0, min: 0 },
  elders: { type: Number, default: 0, min: 0 },
  travelers: [TravelerSchema],

  // -------- Packing --------
  packingList: [PackingCategorySchema],

  // -------- Notes & Photos --------
  notes: [
    {
      text: { type: String, trim: true },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  photos: [{ type: String }]
}, { timestamps: true });

// Explicit index for fast queries by userId
TripSchema.index({ userId: 1 });

export default mongoose.model("Trip", TripSchema);
