import mongoose, { Schema, Model, models } from "mongoose";
import type { Vehicle } from "@/lib/types/vehicle";

const VehicleSchema = new Schema<Vehicle>(
  {
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // recommended for number plates
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    name: {
      type: String,
      required: false,
      default: "Unknown Vehicle"
    },
    type: {
      type: String,
      enum: ['2w', '3w', '4w'],
      default: '4w',
      required: true
    }
  },
  {
    timestamps: false,
  }
);

// Prevent Mongoose overwrite warning in development by deleting the model if it exists
// This ensures that schema changes are applied during HMR
if (process.env.NODE_ENV !== 'production' && models.Vehicle) {
  delete models.Vehicle
}

const VehicleModel: Model<Vehicle> =
  models.Vehicle || mongoose.model<Vehicle>("Vehicle", VehicleSchema, "vehicles");

export default VehicleModel;
