import mongoose, { Schema, Model, models } from "mongoose";
import type { RiskScore } from "@/lib/types/riskScore";

const RiskScoreSchema = new Schema<RiskScore>(
  {
    parkingLotId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ParkingLot",
      index: true,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },

    reason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const RiskScoreModel: Model<RiskScore> =
  models.RiskScore ||
  mongoose.model<RiskScore>("RiskScore", RiskScoreSchema, "riskScores");

export default RiskScoreModel;
