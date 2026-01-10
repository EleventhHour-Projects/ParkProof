import mongoose, { Schema, Model, models } from "mongoose";
import type { Report } from "@/lib/types/report";

const ReportSchema = new Schema<Report>(
  {
    parkingLotId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "ParkingLot",
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "OVERPARKING",
        "UNAUTHORIZED_PARKING",
        "TICKET_FRAUD",
        "OVERCHARGING",
        "OTHER",
      ],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["PENDING", "RESOLVED", "DISMISSED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite in Next.js hot reload
if (process.env.NODE_ENV !== 'production' && models.Report) {
  delete models.Report
}

const ReportModel: Model<Report> =
  models.Report || mongoose.model<Report>("Report", ReportSchema, "reports");

export default ReportModel;
