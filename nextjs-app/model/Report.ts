import mongoose, { Schema, Model, models } from "mongoose";
import type { Report } from "@/lib/types/report";

const ReportSchema = new Schema<Report>(
  {
    parkingLotId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ParkingLot",
      index: true,
    },

    type: {
      type: String,
      enum: [
        "OVERPARKING",
        "TICKET_FRAUD",
        "ATTENDANT_MISBEHAVIOUR",
        "OTHER",
      ],
      required: true,
      index: true,
    },
    reportedBy:{
      type:String,
      required:true,
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const ReportModel: Model<Report> =
  models.Report ||
  mongoose.model<Report>("Report", ReportSchema, "reports");

export default ReportModel;
