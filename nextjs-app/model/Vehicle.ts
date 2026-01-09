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
  },
  {
    timestamps: false,
  }
);

const VehicleModel: Model<Vehicle> =
  models.Vehicle || mongoose.model<Vehicle>("Vehicle", VehicleSchema, "vehicles");

export default VehicleModel;
