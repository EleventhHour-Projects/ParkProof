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
    pid: {
      type: String,
      required: true,
      unique: true,
    },
    area: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 0,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    hasEVCharger: {
      type: Boolean,
      default: false,
    },
    occupied: {
      type: Number,
      default: 0,
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
