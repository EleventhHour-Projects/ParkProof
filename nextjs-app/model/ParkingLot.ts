import mongoose, { Schema, Model, models } from "mongoose";
import type { ParkingLot } from "@/lib/types/parkingLot";

const ParkingLotSchema = new Schema<ParkingLot>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: false, 
  }
);

const ParkingLotModel: Model<ParkingLot> =
  models.ParkingLot ||
  mongoose.model<ParkingLot>("ParkingLot", ParkingLotSchema, "parkingLots");

export default ParkingLotModel;
