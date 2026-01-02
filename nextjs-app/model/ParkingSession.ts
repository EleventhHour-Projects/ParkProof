import mongoose, { Schema, Model, models } from "mongoose";
import type { ParkingSession } from "@/lib/types/parkingSession";

const ParkingSessionSchema = new Schema<ParkingSession>(
  {
    parkingLotId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ParkingLot",
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    entryTime: {
      type: Date,
      required: true,
    },

    exitTime: {
      type: Date,
      default: null,
    },

    entryMethod: {
      type: String,
      enum: ["QR", "OFFLINE"],
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "CLOSED"],
      required: true,
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ParkingSessionSchema.index(
  { parkingLotId: 1, status: 1 }
);

ParkingSessionSchema.index(
  { vehicleNumber: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);


const ParkingSessionModel: Model<ParkingSession> =
  models.ParkingSession ||
  mongoose.model<ParkingSession>(
    "ParkingSession",
    ParkingSessionSchema,
    "parkingSessions"
  );

export default ParkingSessionModel;
